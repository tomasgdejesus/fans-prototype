import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

function createDatabase(client: Client): Database {
  return drizzle({ client, schema });
}

// DATABASE_URL must point to an external transaction pooler: local PgBouncer now,
// or an independently configured pooled endpoint in staging/production. This
// helper does not create a pool or infer pooling from the hostname.
//
// Each call owns one short-lived connection TO the pooler. The pooler reuses
// PostgreSQL backend connections across requests; Workers must not share live
// clients or pools between requests. Reuse this db within the callback and await
// all queries/transactions before returning. Use DATABASE_MIGRATION_URL directly
// from Node tooling (.dev.vars) for migrations; never pass it to this helper.
export async function withDatabase<T>(
  connectionString: string | undefined,
  run: (db: Database) => Promise<T>,
): Promise<T> {
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

  let operationFailed = false;
  try {
    await client.connect();
    // Explicit transactions pin one backend until commit/rollback. Do not depend
    // on session SET state, LISTEN, or session locks across transactions.
    return await run(createDatabase(client));
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    try {
      await client.end();
    } catch (error) {
      // Cleanup must not hide the original connection/query/transaction error.
      if (!operationFailed) throw error;
      console.error("PostgreSQL connection cleanup failed.");
    }
  }
}
