import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, sql } from "drizzle-orm";
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
