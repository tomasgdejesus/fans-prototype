import type { Context, MiddlewareHandler } from "hono";
import type { AuthSession, WorkerEnv } from "../env";

type PlatformRole = AuthSession["user"]["platformRole"];

function accountAuthorizationError(c: Context<WorkerEnv>): Response | null {
  const session = c.get("session");

  if (!session) {
    return c.json({ error: "Authentication required." }, 401);
  }

  if (session.user.status !== "active") {
    return c.json({ error: "Account is inactive." }, 403);
  }

  return null;
}

export const requireActiveAccount: MiddlewareHandler<WorkerEnv> = async (c, next) => {
  const error = accountAuthorizationError(c);
  if (error) return error;

  await next();
};

export function requirePlatformRole(...allowedRoles: PlatformRole[]): MiddlewareHandler<WorkerEnv> {
  return async (c, next) => {
    const error = accountAuthorizationError(c);
    if (error) return error;

    const session = c.get("session");
    if (!session || !allowedRoles.includes(session.user.platformRole)) {
      return c.json({ error: "Insufficient permissions." }, 403);
    }

    await next();
  };
}
