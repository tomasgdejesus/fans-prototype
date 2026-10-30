import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";
import type { Auth } from "../auth";
import type { AuthSession, WorkerEnv } from "../env";
import { requireActiveAccount, requirePlatformRole } from "../middleware/authorization";
import { createSessionMiddleware } from "../middleware/session";

function createTestSession(status = "active", platformRole = "user", emailVerified = true): AuthSession {
  return { user: { status, platformRole, emailVerified } } as unknown as AuthSession;
}

function createAuth(getSession: ReturnType<typeof vi.fn>): Auth {
  return { api: { getSession } } as unknown as Auth;
}

describe("session middleware", () => {
  it("retrieves the session with request headers and propagates it through context", async () => {
    const session = createTestSession();
    const getSession = vi.fn().mockResolvedValue(session);
    const auth = createAuth(getSession);
    const app = new Hono<WorkerEnv>()
      .use("*", createSessionMiddleware(auth))
      .get("/", (c) => c.json({ session: c.get("session") }));

    const response = await app.request("/", {
      headers: { cookie: "better-auth.session_token=test-token" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ session });
    expect(getSession).toHaveBeenCalledOnce();
    expect(getSession.mock.calls[0]?.[0]).toMatchObject({
      headers: expect.any(Headers),
    });
    expect((getSession.mock.calls[0]?.[0] as { headers: Headers }).headers.get("cookie")).toBe(
      "better-auth.session_token=test-token",
    );
  });

  it("stores a missing session as null and allows the request to continue", async () => {
    const getSession = vi.fn().mockResolvedValue(null);
    const app = new Hono<WorkerEnv>()
      .use("*", createSessionMiddleware(createAuth(getSession)))
      .get("/", (c) => c.json({ session: c.get("session"), continued: true }));

    const response = await app.request("/");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ session: null, continued: true });
  });

  it("returns a generic service error when session lookup fails", async () => {
    const getSession = vi.fn().mockRejectedValue(new Error("sensitive database details"));
    const app = new Hono<WorkerEnv>()
      .use("*", createSessionMiddleware(createAuth(getSession)))
      .get("/", (c) => c.text("should not continue"));

    const response = await app.request("/");

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Authentication is unavailable." });
  });

  it("denies protected access to an unverified session created under the old policy", async () => {
    const getSession = vi.fn().mockResolvedValue(createTestSession("active", "admin", false));
    const app = new Hono<WorkerEnv>()
      .use("*", createSessionMiddleware(createAuth(getSession)))
      .get("/", requireActiveAccount, (c) => c.json({ ok: true }));
    const response = await app.request("/");
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required." });
  });

  it("does not convert downstream failures into authentication errors", async () => {
    const getSession = vi.fn().mockResolvedValue(null);
    const app = new Hono<WorkerEnv>()
      .use("*", createSessionMiddleware(createAuth(getSession)))
      .get("/", () => {
        throw new Error("downstream failure");
      });

    app.onError((error, c) => c.json({ error: error.message }, 500));

    const response = await app.request("/");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "downstream failure" });
  });
});

describe("authorization middleware", () => {
  function buildApp(session: AuthSession | null, guard: MiddlewareHandler<WorkerEnv>) {
    const app = new Hono<WorkerEnv>();
    app.use("*", async (c, next) => {
      c.set("session", session);
      await next();
    });
    app.get("/", guard, (c) => c.json({ ok: true }));
    return app;
  }

  it("requires a session and returns a JSON 401 without redirecting", async () => {
    const response = await buildApp(null, requireActiveAccount).request("/");

    expect(response.status).toBe(401);
    expect(response.headers.get("location")).toBeNull();
    expect(await response.json()).toEqual({ error: "Authentication required." });
  });

  it("allows active accounts and rejects inactive accounts with JSON 403", async () => {
    const allowed = await buildApp(createTestSession("active"), requireActiveAccount).request("/");
    const denied = await buildApp(createTestSession("suspended"), requireActiveAccount).request("/");

    expect(allowed.status).toBe(200);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({ error: "Account is inactive." });
  });

  it("allows configured platform roles and rejects other roles", async () => {
    const allowed = await buildApp(
      createTestSession("active", "admin"),
      requirePlatformRole("admin", "staff"),
    ).request("/");
    const denied = await buildApp(
      createTestSession("active", "user"),
      requirePlatformRole("admin", "staff"),
    ).request("/");

    expect(allowed.status).toBe(200);
    expect(denied.status).toBe(403);
    expect(await denied.json()).toEqual({ error: "Insufficient permissions." });
  });

  it("checks authentication and account activity before roles", async () => {
    const missing = await buildApp(null, requirePlatformRole("admin")).request("/");
    const inactive = await buildApp(
      createTestSession("archived", "admin"),
      requirePlatformRole("admin"),
    ).request("/");

    expect(missing.status).toBe(401);
    expect(inactive.status).toBe(403);
    expect(await inactive.json()).toEqual({ error: "Account is inactive." });
  });
});
