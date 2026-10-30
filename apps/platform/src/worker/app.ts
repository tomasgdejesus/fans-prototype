import { Hono } from "hono";
import { sql } from "drizzle-orm";
import type { WorkerEnv } from "./env";
import { withDatabase } from "./db/client";
import { createAuth, readAuthConfig } from "./auth";
import { readEmailConfig, type EmailConfig } from "./email/config";
import { createEmailSender } from "./email";
import { deliverEmailTasks } from "./email/auth";
import type { EmailTask } from "./email/types";

// Choose connection ownership at the hosting boundary; routes only receive a db.
export function createApp(useDatabase: typeof withDatabase, useEmailSender = createEmailSender) {
  const app = new Hono<WorkerEnv>()
    .all("/api/auth/*", async (c) => {
      const config = readAuthConfig({
        baseURL: c.env?.BETTER_AUTH_URL,
        secret: c.env?.BETTER_AUTH_SECRET,
      });
      if (!config || !c.env?.DATABASE_URL) {
        return c.json({ error: "Authentication is unavailable." }, 503);
      }

      let emailConfig: EmailConfig;
      try {
        emailConfig = readEmailConfig(c.env);
      } catch (error) {
        // Config validation errors contain only fixed descriptions, never values.
        console.error(error instanceof Error ? error.message : "Email configuration is invalid.");
        return c.json({ error: "Email configuration is invalid." }, 503);
      }

      try {
        const sender = useEmailSender(emailConfig);
        const tasks: EmailTask[] = [];
        const response = await useDatabase(c.env.DATABASE_URL, async (db) => {
          // Complete database work before the runner's connection scope ends.
          const auth = createAuth(db, config, { sendEmail: sender, enqueue: (task) => { tasks.push(task); } });
          return await auth.handler(c.req.raw);
        });
        // Unverified sign-in deliberately returns 403 after queuing a new link.
        // Dispatch after the handler's database scope closes, including that case.
        let verificationRequired = false;
        if (response.status === 403) {
          const body: unknown = await response.clone().json().catch(() => null);
          verificationRequired = typeof body === "object" && body !== null
            && "code" in body && body.code === "EMAIL_NOT_VERIFIED";
        }
        if (response.ok || verificationRequired) {
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
