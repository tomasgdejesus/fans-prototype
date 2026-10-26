import type { MiddlewareHandler } from "hono";
import type { Auth } from "../auth";
import type { AuthSession, WorkerEnv } from "../env";

export function createSessionMiddleware(auth: Auth): MiddlewareHandler<WorkerEnv> {
  return async (c, next) => {
    let session: AuthSession | null;

    try {
      session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
    } catch {
      return c.json({ error: "Authentication is unavailable." }, 503);
    }

    c.set("session", session);
    await next();
  };
}
