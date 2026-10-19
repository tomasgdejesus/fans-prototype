import { Hono } from "hono";
import type { WorkerEnv } from "./env";

const app = new Hono<WorkerEnv>()
  .get("/api/health", (c) => c.json({ status: "ok" } as const));

app.notFound((c) => c.json({ error: "Not found" }, 404));

// Chain future .route() calls above so their types reach the RPC client.
export type AppType = typeof app;
export default app;
