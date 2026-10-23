import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { Client } from "pg";
import { v7 as uuidv7 } from "uuid";
import app from "../app";
import { withDatabase } from "../db/client";
import * as schema from "../db/schema";

// Never fall back to application credentials: use an explicitly selected,
// migrated development/test database. Each fixture is rolled back.
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("Set TEST_DATABASE_URL to a migrated PostgreSQL test database.");

let client: Client;
let db: NodePgDatabase<typeof schema>;

beforeEach(async () => {
  client = new Client({ connectionString: url, connectionTimeoutMillis: 5_000 });
  await client.connect();
  await client.query("BEGIN");
  db = drizzle({ client, schema });
});

afterEach(async () => {
  try {
    await client?.query("ROLLBACK");
  } finally {
    await client?.end();
  }
});

describe("PostgreSQL integration", () => {
  it("installs native UUID columns, database defaults, and update triggers for every table", async () => {
    const tables = Object.values(schema).map((table) => getTableConfig(table));
    const { rows: columns } = await client.query<{
      table_name: string; column_name: string; udt_name: string; column_default: string | null;
    }>(`
      SELECT table_name, column_name, udt_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `);
    const { rows: triggers } = await client.query<{ table_name: string }>(`
      SELECT c.relname AS table_name
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_proc p ON p.oid = t.tgfoid
      JOIN pg_namespace pn ON pn.oid = p.pronamespace
      WHERE n.nspname = 'public' AND pn.nspname = 'public'
        AND t.tgname = 'fans_set_updated_at' AND p.proname = 'fans_set_updated_at'
        AND NOT t.tgisinternal AND t.tgenabled = 'O' AND t.tgtype = 19
    `);
    for (const table of tables) {
      for (const column of table.columns.filter((c) => c.getSQLType() === "uuid")) {
        expect(columns.find((c) => c.table_name === table.name && c.column_name === column.name))
          .toMatchObject({ udt_name: "uuid" });
      }
      expect(columns.find((c) => c.table_name === table.name && c.column_name === "id"))
        .toMatchObject({ column_default: "uuidv7()" });
      for (const column of ["created_at", "updated_at"]) {
        expect(columns.find((c) => c.table_name === table.name && c.column_name === column))
          .toMatchObject({ column_default: "now()" });
      }
      expect(triggers).toContainEqual({ table_name: table.name });
    }
  });

  it("generates IDs and timestamps and refreshes updated_at through direct SQL", async () => {
    const inserted = await client.query<{
      id: string; created_at: Date; updated_at: Date; version: number; default_time: boolean;
    }>(`
      INSERT INTO "user" (display_name, email)
      VALUES ('SQL user', $1)
      RETURNING id, created_at, updated_at, uuid_extract_version(id) AS version,
        created_at = now()::timestamptz(3) AND updated_at = now()::timestamptz(3) AS default_time
    `, [`${uuidv7()}@example.invalid`]);
    const user = inserted.rows[0];
    expect(user.version).toBe(7);
    expect(user.default_time).toBe(true);
    expect(user.created_at).toBeInstanceOf(Date);

    // The trigger overrides supplied update metadata, including on a no-op business update.
    for (const value of ["2000-01-01T00:00:00Z", "2100-01-01T00:00:00Z"]) {
      const { rows: [updated] } = await client.query<{
        created_at: Date; updated_at: Date; statement_time: boolean;
      }>(`
        UPDATE "user" SET display_name = display_name, updated_at = $2
        WHERE id = $1
        RETURNING created_at, updated_at,
          updated_at = statement_timestamp()::timestamptz(3) AS statement_time
      `, [user.id, value]);
      expect(updated.created_at).toEqual(user.created_at);
      expect(updated.statement_time).toBe(true);
    }
  });

  it("generates random verification codes in SQL and preserves supplied business timestamps", async () => {
    const { rows: [learner] } = await client.query<{ id: string }>(`
      INSERT INTO learners (first_name, last_name) VALUES ('SQL', 'Learner') RETURNING id
    `);
    const { rows: [course] } = await client.query<{ id: string }>(`
      INSERT INTO courses (code, title, description) VALUES ($1, 'SQL course', 'Test') RETURNING id
    `, [uuidv7()]);
    const { rows: [enrollment] } = await client.query<{ id: string }>(`
      INSERT INTO enrollments (learner_id, course_id) VALUES ($1, $2) RETURNING id
    `, [learner.id, course.id]);
    const issuedAt = new Date("2000-01-01T00:00:00Z");
    const expiresAt = new Date("2005-01-01T00:00:00Z");
    const { rows: [certificate] } = await client.query<{
      id: string; version: number; verification_code: string; issued_at: Date; expires_at: Date;
    }>(`
      INSERT INTO certificates (
        certificate_number, learner_id, enrollment_id, recipient_name_snapshot,
        credential_title_snapshot, issued_at, expires_at
      ) VALUES ($1, $2, $3, 'SQL Learner', 'SQL credential', $4, $5)
      RETURNING id, uuid_extract_version(id) AS version, verification_code, issued_at, expires_at
    `, [uuidv7(), learner.id, enrollment.id, issuedAt, expiresAt]);
    expect(certificate.version).toBe(7);
    expect(certificate.verification_code).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(certificate.issued_at).toEqual(issuedAt);
    expect(certificate.expires_at).toEqual(expiresAt);

    const { rows: [updated] } = await client.query<{ issued_at: Date; expires_at: Date }>(`
      UPDATE certificates SET document_reference = 'test-document'
      WHERE id = $1 RETURNING issued_at, expires_at
    `, [certificate.id]);
    expect(updated.issued_at).toEqual(issuedAt);
    expect(updated.expires_at).toEqual(expiresAt);
  });

  it("round-trips native booleans, timestamps, JSONB, and amounts above int32", async () => {
    const [user] = await db.insert(schema.user).values({
      name: "Test purchaser", email: `${uuidv7()}@example.invalid`,
      updatedAt: new Date("2000-01-01T00:00:00Z"),
    }).returning();
    expect(user.emailVerified).toBe(false);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
    const [updated] = await db.update(schema.user).set({ name: "Updated" })
      .where(eq(schema.user.id, user.id)).returning();
    expect(updated.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());

    const [order] = await db.insert(schema.orders).values({
      orderNumber: uuidv7(), placedByUserId: user.id,
      purchaserNameSnapshot: user.name, purchaserEmailSnapshot: user.email,
      billingDetailsSnapshot: { city: "Tempe", nested: { test: true } },
      currency: "USD", subtotalAmount: 3_000_000_000, totalAmount: 3_000_000_000,
    }).returning();
    expect(order.totalAmount).toBe(3_000_000_000);
    expect(order.billingDetailsSnapshot).toEqual({ city: "Tempe", nested: { test: true } });
  });

  it("rejects invalid currency and unsafe integer amounts", async () => {
    const [product] = await db.insert(schema.products).values({
      sku: uuidv7(), name: "Test", description: "Test", productType: "course_access",
    }).returning();
    await client.query("SAVEPOINT invalid_currency");
    await expect(db.insert(schema.productPrices).values({
      productId: product.id, currency: "usd", unitAmount: 100,
    })).rejects.toMatchObject({ cause: { code: "23514", constraint: "product_prices_currency_check" } });
    await client.query("ROLLBACK TO SAVEPOINT invalid_currency");
    await expect(db.insert(schema.productPrices).values({
      productId: product.id, currency: "USD", unitAmount: Number.MAX_SAFE_INTEGER + 1,
    })).rejects.toMatchObject({ cause: { code: "23514", constraint: "product_prices_amount_check" } });
  });

  it("rejects a certificate whose learner differs from its enrollment", async () => {
    const [learner, other] = await db.insert(schema.learners).values([
      { firstName: "First", lastName: "Learner" },
      { firstName: "Other", lastName: "Learner" },
    ]).returning();
    const [course] = await db.insert(schema.courses).values({
      code: uuidv7(), title: "Test", description: "Test",
    }).returning();
    const [enrollment] = await db.insert(schema.enrollments).values({
      learnerId: learner.id, courseId: course.id,
    }).returning();
    await expect(db.insert(schema.certificates).values({
      certificateNumber: uuidv7(), learnerId: other.id, enrollmentId: enrollment.id,
      recipientNameSnapshot: "Other Learner", credentialTitleSnapshot: "Test",
    })).rejects.toMatchObject({ cause: { code: "23503", constraint: "certificates_enrollment_learner_fk" } });
  });

  it("rejects duplicate provider events", async () => {
    const event = {
      provider: "test", providerAccountReference: "test-account",
      environment: "test" as const, providerEventId: uuidv7(),
      eventType: "payment.succeeded", payloadJson: { test: true },
    };
    await db.insert(schema.paymentEvents).values(event);
    await expect(db.insert(schema.paymentEvents).values(event)).rejects.toMatchObject({
      cause: { code: "23505", constraint: "payment_events_provider_event_unique" },
    });
  });

  it("rolls back interactive transactions and reports database readiness", async () => {
    const id = uuidv7();
    await withDatabase(url, async (database) => {
      await expect(database.transaction(async (tx) => {
        await tx.insert(schema.courses).values({ id, code: id, title: "Rollback", description: "Test" });
        throw new Error("Abort test transaction");
      })).rejects.toThrow("Abort test transaction");
      const result = await database.execute(sql`select id from courses where id = ${id}`);
      expect(result.rows).toHaveLength(0);
    });

    const response = await app.request("/api/health/db", undefined, { DATABASE_URL: url });
    expect(response.status).toBe(200);
  });
});
