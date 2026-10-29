import { createDatabaseConnection, type Database } from "../../db/client";

// Node has no Worker invocation teardown. Exercise the same pg/Drizzle setup
// while explicitly releasing each test request's connection, including failures.
export async function withTestDatabase<T>(
  connectionString: string | undefined,
  run: (db: Database) => Promise<T>,
): Promise<T> {
  const { client, db } = createDatabaseConnection(connectionString);
  let outcome: { ok: true; value: T } | { ok: false; error: unknown };

  try {
    await client.connect();
    outcome = { ok: true, value: await run(db) };
  } catch (error) {
    outcome = { ok: false, error };
  }

  try {
    await client.end();
  } catch (error) {
    if (outcome.ok) throw error;
    console.error("PostgreSQL test connection cleanup failed.");
  }

  if (!outcome.ok) throw outcome.error;
  return outcome.value;
}
