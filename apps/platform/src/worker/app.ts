import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { WorkerEnv } from "./env";
import { withDatabase } from "./db/client";
import { createAuth, readAuthConfig } from "./auth";

const app = new Hono<WorkerEnv>()
  .all("/api/auth/*", async (c) => {
    const config = readAuthConfig({
      baseURL: c.env?.BETTER_AUTH_URL,
      secret: c.env?.BETTER_AUTH_SECRET,
    });
    if (!config || !c.env?.DATABASE_URL) {
      return c.json({ error: "Authentication is unavailable." }, 503);
    }

    try {
      return await withDatabase(c.env.DATABASE_URL, async (db) => {
        // Finish auth work before withDatabase closes this request's connection.
        const auth = createAuth(db, config);
        return await auth.handler(c.req.raw);
      });
    } catch {
      console.error("Authentication request failed.");
      return c.json({ error: "Authentication is unavailable." }, 503);
    }
  })
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
