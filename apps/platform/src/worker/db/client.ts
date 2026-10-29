import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

// Build an unconnected client/database pair; the caller owns its lifecycle.
// DATABASE_URL targets an external transaction pooler, never the migration URL.
export function createDatabaseConnection(connectionString: string | undefined) {
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const client = new Client({
    // TLS follows the supplied URL. Only local Docker examples disable it;
    // hosted endpoints must use their verified TLS configuration.
    connectionString,
    connectionTimeoutMillis: 5_000,
    // Client deadline includes pooler queueing. Backend statement limits belong
    // at the endpoint/database, not in startup parameters PgBouncer may reject.
    query_timeout: 20_000,
    application_name: "fans-platform",
  });
  // Keep unexpected connection errors visible, including stream cancellation.
  // Select fields explicitly: the driver error can reference its entire client.
  client.on("error", (error: Error & { code?: string }) => {
    console.error("PostgreSQL connection failed.", {
      name: error.name,
      code: error.code,
      message: error.message,
    });
  });

  const db: Database = drizzle({ client, schema });
  return { client, db };
}

// Worker HTTP adapter: invocation teardown owns socket cleanup. Explicit end()
// caused late CloudflareSocket cancellation in local testing, so omit it here.
// Await all database work before returning; never share clients across requests.
// Node callers must own cleanup or inject a pool-backed runner through createApp.
export async function withDatabase<T>(
  connectionString: string | undefined,
  run: (db: Database) => Promise<T>,
): Promise<T> {
  const { client, db } = createDatabaseConnection(connectionString);
  await client.connect();
  // Transactions pin one backend; session state must not span transactions.
  return await run(db);
}
