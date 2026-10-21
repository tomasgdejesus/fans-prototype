import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { WorkerEnv } from "./env";
import { withDatabase } from "./db/client";

const app = new Hono<WorkerEnv>()
  .get("/api/health", (c) => c.json({ status: "ok" } as const))
  .get("/api/health/db", async (c) => {
    try {
      await withDatabase(c.env?.DATABASE_URL, async (db) => {
        await db.execute(sql`select 1`);
      });
      return c.json({ status: "ok" } as const);
    } catch {
      return c.json({ status: "unavailable" } as const, 503);
    }
  });

app.notFound((c) => c.json({ error: "Not found" }, 404));

// Chain future .route() calls above so their types reach the RPC client.
export type AppType = typeof app;
export default app;
