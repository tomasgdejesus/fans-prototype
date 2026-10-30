import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { WorkerEnv } from "./env";
import { withDatabase } from "./db/client";
import { createAuth, readAuthConfig } from "./auth";
import { readEmailConfig } from "./email/config";
import { createEmailSender } from "./email";
import { deliverEmailTasks } from "./email/auth";
import type { EmailTask } from "./email/types";

// Choose connection ownership at the hosting boundary; routes only receive a db.
export function createApp(useDatabase: typeof withDatabase, useEmailSender = createEmailSender) {
  const app = new Hono<WorkerEnv>()
    .get("/api/auth-capabilities", (c) => {
      c.header("Cache-Control", "no-store");
      try {
        const email = readEmailConfig(c.env);
        const configured = Boolean(readAuthConfig({ baseURL: c.env?.BETTER_AUTH_URL, secret: c.env?.BETTER_AUTH_SECRET }) && c.env?.DATABASE_URL);
        const enabled = configured && email.provider !== "disabled";
        return c.json({ emailVerification: enabled, passwordReset: enabled });
      } catch {
        return c.json({ error: "Email configuration is invalid." }, 503);
      }
    })
    .all("/api/auth/*", async (c) => {
      const config = readAuthConfig({
        baseURL: c.env?.BETTER_AUTH_URL,
        secret: c.env?.BETTER_AUTH_SECRET,
      });
      if (!config || !c.env?.DATABASE_URL) {
        return c.json({ error: "Authentication is unavailable." }, 503);
      }

      try {
        const sender = useEmailSender(readEmailConfig(c.env));
        const tasks: EmailTask[] = [];
        const response = await useDatabase(c.env.DATABASE_URL, async (db) => {
          // Complete database work before the runner's connection scope ends.
          const auth = createAuth(db, config, sender ? { sendEmail: sender, enqueue: (task) => { tasks.push(task); } } : undefined);
          return await auth.handler(c.req.raw);
        });
        // Dispatch only after the auth handler and its transactions have completed.
        if (response.ok) {
          let waitUntil: ((promise: Promise<unknown>) => void) | undefined;
          try { waitUntil = c.executionCtx.waitUntil.bind(c.executionCtx); }
          catch { /* Node hosts await delivery below; Workers owns its task lifetime. */ }
          await deliverEmailTasks(tasks, waitUntil);
        }
        return response;
      } catch {
        console.error("Authentication request failed.");
        return c.json({ error: "Authentication is unavailable." }, 503);
      }
    })
    .get("/api/health", (c) => c.json({ status: "ok" } as const))
    .get("/api/health/db", async (c) => {
      try {
        await useDatabase(c.env?.DATABASE_URL, async (db) => {
          await db.execute(sql`select 1`);
        });
        return c.json({ status: "ok" } as const);
      } catch {
        return c.json({ status: "unavailable" } as const, 503);
      }
    });

  app.notFound((c) => c.json({ error: "Not found" }, 404));

  return app;
}

// The default export is the Worker entry point; other hosts choose their runner.
const app = createApp(withDatabase);

// Chain future .route() calls above so their types reach the RPC client.
export type AppType = typeof app;
export default app;
