import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sign } from "hono/jwt";
import app, { createApp } from "../app";
import * as authModule from "../auth";
import { withDatabase, type Database } from "../db/client";
import * as schema from "../db/schema";

vi.mock("../db/client", async (importOriginal) => ({
  ...await importOriginal<typeof import("../db/client")>(),
  withDatabase: vi.fn(),
}));

const origin = "http://localhost:5173";
const emailBindings = {
  EMAIL_PROVIDER: "maildev", EMAIL_FROM: "FANS <noreply@fans.test>", SMTP_HOST: "127.0.0.1", SMTP_PORT: "1025",
};
const bindings = {
  ...emailBindings,
  DATABASE_URL: "postgresql://unused:unused@localhost/unused",
  BETTER_AUTH_URL: origin,
  BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
};

let pool: Pool;
let db: Database;
let events: string[];
const delivery = { sendEmail: vi.fn().mockResolvedValue(undefined) };

async function useTestDatabase<T>(url: string | undefined, run: (db: Database) => Promise<T>): Promise<T> {
  expect(url).toBe(bindings.DATABASE_URL);
  events.push("open");
  try { return await run(db); }
  finally { events.push("close"); }
}

beforeEach(() => {
  // The real Drizzle adapter and Better Auth handle non-database endpoints.
  // Any unexpected SQL fails immediately instead of opening a connection.
  pool = new Pool();
  vi.spyOn(pool, "query").mockImplementation(() => { throw new Error("Unexpected SQL in the primary auth suite."); });
  vi.spyOn(pool, "connect").mockImplementation(() => { throw new Error("Unexpected connection in the primary auth suite."); });
  db = drizzle({ client: pool, schema });
  events = [];
  vi.mocked(withDatabase).mockImplementation(useTestDatabase);
  delivery.sendEmail.mockClear();
});

afterEach(async () => {
  await pool.end();
  vi.restoreAllMocks();
  vi.mocked(withDatabase).mockReset();
});

describe("Better Auth HTTP integration", () => {
  it("checks a token without exposing its account or invoking email delivery", async () => {
    const token = await sign({ email: "learner@example.com", exp: Math.floor(Date.now() / 1000) + 3600 }, bindings.BETTER_AUTH_SECRET, "HS256");
    const limit = vi.fn().mockResolvedValue([{ emailVerified: true }]);
    const select = vi.fn(() => ({ from: () => ({ where: () => ({ limit }) }) }));
    const database = { select } as unknown as Database;
    const runner: typeof withDatabase = async (_url, run) => run(database);
    const sender = vi.fn(() => delivery.sendEmail);
    const response = await createApp(runner, sender).request(`${origin}/api/auth/verification-status`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }),
    }, bindings);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ status: "verified" });
    expect(select).toHaveBeenCalledOnce();
    expect(sender).not.toHaveBeenCalled();
  });

  it("rejects a forged status token without opening the database", async () => {
    const response = await app.request(`${origin}/api/auth/verification-status`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: "forged-token" }),
    }, bindings);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "invalid" });
    expect(withDatabase).not.toHaveBeenCalled();
  });

  it.each([{}, { token: "" }, { token: 7 }, { token: "x".repeat(8193) }, { token: "signed", email: "learner@example.com" }])(
    "rejects invalid verification-status input before opening the database", async (input) => {
      const response = await app.request(`${origin}/api/auth/verification-status`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
      }, bindings);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "Invalid verification request." });
      expect(withDatabase).not.toHaveBeenCalled();
    },
  );

  it("mounts the real Better Auth health endpoint", async () => {
    const response = await app.request(`${origin}/api/auth/ok`, {}, bindings);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(events).toEqual(["open", "close"]);
  });

  it("returns no session without a cookie", async () => {
    const response = await app.request(`${origin}/api/auth/get-session`, {}, bindings);
    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
    expect(pool.query).not.toHaveBeenCalled();
  });

  it("keeps unknown auth paths inside Better Auth", async () => {
    const response = await app.request(`${origin}/api/auth/does-not-exist`, {}, bindings);
    expect(response.status).toBe(404);
    expect(withDatabase).toHaveBeenCalledOnce();
  });

  it.each([
    { path: "/sign-out", requestOrigin: "https://untrusted.example", body: {} },
    {
      path: "/sign-up/email", requestOrigin: origin,
      body: {
        name: "FANS user", email: "test@example.invalid", password: "test-only-long-password-123!",
        callbackURL: "https://untrusted.example/steal",
      },
    },
  ])("rejects an untrusted origin or callback on $path before querying the database", async ({ path, requestOrigin, body }) => {
    const response = await app.request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: requestOrigin, cookie: "fixture=old" },
      body: JSON.stringify(body),
    }, bindings);
    expect(response.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { ...bindings, DATABASE_URL: undefined },
    { ...bindings, BETTER_AUTH_SECRET: undefined },
    { ...bindings, BETTER_AUTH_SECRET: "short" },
    { ...bindings, BETTER_AUTH_URL: "not-a-url" },
    { ...bindings, BETTER_AUTH_URL: "https://user:password@example.com" },
    { ...bindings, BETTER_AUTH_URL: "https://example.com/api/auth" },
    { ...bindings, BETTER_AUTH_URL: "file:///tmp/auth" },
  ])("rejects missing or invalid configuration before opening the database", async (env) => {
    const response = await app.request(`${origin}/api/auth/ok`, {}, env);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Authentication is unavailable." });
    expect(withDatabase).not.toHaveBeenCalled();
  });

  it.each([
    { EMAIL_PROVIDER: undefined }, { EMAIL_PROVIDER: "disabled" }, { EMAIL_PROVIDER: "private-unsupported-provider" },
    { EMAIL_FROM: undefined }, { SMTP_HOST: undefined }, { SMTP_PORT: undefined }, { SMTP_PORT: "invalid-private-port" },
  ])("rejects invalid email configuration before opening the database: %o", async (override) => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await app.request(`${origin}/api/auth/ok`, {}, { ...bindings, ...override });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Email configuration is invalid." });
    expect(withDatabase).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledOnce();
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/private-unsupported-provider|invalid-private-port/);
  });

  it("forwards the raw request and preserves the handler's status and cookies", async () => {
    const auth = authModule.createAuth(db, { baseURL: origin, secret: bindings.BETTER_AUTH_SECRET }, delivery);
    vi.spyOn(auth, "handler").mockImplementation(async (request) => {
      events.push("handler");
      expect(request.method).toBe("POST");
      expect(request.headers.get("cookie")).toBe("fixture=old");
      expect(await request.json()).toEqual({ email: "test@example.invalid" });
      events.push("finished");
      const response = new Response("accepted", { status: 202 });
      response.headers.append("set-cookie", "fixture=new; Path=/; HttpOnly");
      response.headers.append("set-cookie", "fixture-preference=remember; Path=/; HttpOnly");
      return response;
    });
    vi.spyOn(authModule, "createAuth").mockReturnValue(auth);

    const response = await app.request(`${origin}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "fixture=old" },
      body: JSON.stringify({ email: "test@example.invalid" }),
    }, bindings);

    expect(response.status).toBe(202);
    expect(await response.text()).toBe("accepted");
    expect(response.headers.getSetCookie()).toEqual([
      "fixture=new; Path=/; HttpOnly",
      "fixture-preference=remember; Path=/; HttpOnly",
    ]);
    expect(events).toEqual(["open", "handler", "finished", "close"]);
  });

  it.each([
    { status: 200, body: "result", sends: true },
    { status: 403, body: JSON.stringify({ code: "EMAIL_NOT_VERIFIED" }), sends: true },
    { status: 403, body: JSON.stringify({ code: "INVALID_ORIGIN" }), sends: false },
    { status: 403, body: "not JSON", sends: false },
    { status: 500, body: JSON.stringify({ code: "EMAIL_NOT_VERIFIED" }), sends: false },
    { status: 302, body: "redirect", sends: true, path: "/api/auth/verify-email" },
    { status: 302, body: "redirect", sends: false, path: "/api/auth/test" },
  ])("dispatches staged mail after the database scope closes: $status $body", async ({ status, body, sends, path }) => {
    const sendEmail = vi.fn(async () => { events.push("mail"); });
    const auth = authModule.createAuth(db, { baseURL: origin, secret: bindings.BETTER_AUTH_SECRET }, delivery);
    vi.spyOn(authModule, "createAuth").mockImplementation((_db, _config, delivery) => {
      vi.spyOn(auth, "handler").mockImplementation(async () => {
        delivery.enqueue?.(() => sendEmail());
        return new Response(body, { status });
      });
      return auth;
    });
    const response = await createApp(withDatabase, () => sendEmail).request(`${origin}${path ?? "/api/auth/test"}`, {}, bindings);
    expect(response.status).toBe(status);
    expect(await response.text()).toBe(body);
    expect(events).toEqual(sends ? ["open", "close", "mail"] : ["open", "close"]);
    expect(sendEmail).toHaveBeenCalledTimes(sends ? 1 : 0);
  });

  it("reports delivery failure on an awaiting host after closing the database scope", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const sendEmail = vi.fn(async () => {
      events.push("mail");
      throw new Error("private-recipient-token");
    });
    const auth = authModule.createAuth(db, { baseURL: origin, secret: bindings.BETTER_AUTH_SECRET }, delivery);
    vi.spyOn(authModule, "createAuth").mockImplementation((_db, _config, email) => {
      vi.spyOn(auth, "handler").mockImplementation(async () => {
        email.enqueue?.(sendEmail);
        return new Response("accepted");
      });
      return auth;
    });
    const response = await createApp(withDatabase, () => sendEmail).request(`${origin}/api/auth/test`, {}, bindings);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Authentication is unavailable." });
    expect(events).toEqual(["open", "close", "mail"]);
    expect(log).toHaveBeenCalledWith("Authentication email delivery failed.");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-recipient-token");
  });

  it("keeps the Worker response neutral while exposing background delivery failures to its host", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    let completed!: Promise<unknown>;
    const executionCtx = {
      waitUntil(promise: Promise<unknown>) {
        completed = promise;
        void promise.catch(() => {});
      },
      passThroughOnException() {},
      props: {}, exports: {},
    };
    const sendEmail = vi.fn(async () => {
      events.push("mail");
      throw new Error("private-recipient-token");
    });
    const auth = authModule.createAuth(db, { baseURL: origin, secret: bindings.BETTER_AUTH_SECRET }, delivery);
    vi.spyOn(authModule, "createAuth").mockImplementation((_db, _config, email) => {
      vi.spyOn(auth, "handler").mockImplementation(async () => {
        email.enqueue?.(sendEmail);
        return new Response("accepted");
      });
      return auth;
    });
    const response = await createApp(withDatabase, () => sendEmail).request(`${origin}/api/auth/test`, {}, bindings, executionCtx);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("accepted");
    await expect(completed).rejects.toThrow("Authentication email delivery failed.");
    expect(events).toEqual(["open", "close", "mail"]);
    expect(log).toHaveBeenCalledExactlyOnceWith("Authentication email delivery failed.");
  });

  it("does not expose database errors or secrets", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(withDatabase).mockRejectedValue(new Error(`${bindings.DATABASE_URL} ${bindings.BETTER_AUTH_SECRET}`));
    const response = await app.request(`${origin}/api/auth/ok`, {}, bindings);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Authentication is unavailable." });
    expect(console.error).toHaveBeenCalledWith("Authentication request failed.");
  });
});
