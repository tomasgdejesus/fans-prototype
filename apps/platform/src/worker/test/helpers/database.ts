import { createDatabaseConnection, type Database } from "../../db/client";

// Node has no Worker invocation teardown. Exercise the same pg/Drizzle setup
// while explicitly releasing each test request's connection, including failures.
export async function withTestDatabase<T>(
  connectionString: string | undefined,
  run: (db: Database) => Promise<T>,
): Promise<T> {
  const { client, db } = createDatabaseConnection(connectionString);
  let operationFailed = false;
  try {
    await client.connect();
    return await run(db);
  } catch (error) {
    operationFailed = true;
    throw error;
  } finally {
    try {
      await client.end();
    } catch (error) {
      if (!operationFailed) throw error;
      console.error("PostgreSQL test connection cleanup failed.");
    }
  }
}
