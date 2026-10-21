import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDatabase>;

function createDatabase(pool: Pool) {
  return drizzle({ client: pool, schema });
}

// A Worker request owns its connections. Keep live pools out of module scope.
// A future hosting adapter can supply a Hyperdrive connectionString here.
export async function withDatabase<T>(
  connectionString: string | undefined,
  run: (db: Database) => Promise<T>,
): Promise<T> {
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
    query_timeout: 10_000,
    statement_timeout: 10_000,
    application_name: "fans-platform",
  });
  // Idle connection failures are emitted separately from query rejections.
  // Never log connection strings or raw database errors to public responses.
  pool.on("error", () => console.error("PostgreSQL idle connection failed."));

  try {
    return await run(createDatabase(pool));
  } finally {
    await pool.end();
  }
}
