import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import app from "../../app";

// Exercise the production route and request-owned connections against an explicitly
// selected, migrated test database. Never fall back to DATABASE_URL.
const url = process.env.TEST_DATABASE_URL;
const directUrl = process.env.TEST_DATABASE_DIRECT_URL;
if (!url || !directUrl) throw new Error("Set TEST_DATABASE_URL (pooled) and TEST_DATABASE_DIRECT_URL (direct) to the same migrated PostgreSQL test database.");

const origin = "http://localhost:5173";
const password = "test-only-long-password-123!";
const bindings = {
  DATABASE_URL: url,
  BETTER_AUTH_URL: origin,
  BETTER_AUTH_SECRET: "integration-test-only-secret-at-least-32-characters",
};

const client = new Client({ connectionString: directUrl, connectionTimeoutMillis: 5_000 });
let email: string;

type AuthUser = {
  id: string;
  email: string;
  platformRole: string;
  status: string;
  emailVerified: boolean;
};

beforeAll(async () => { await client.connect(); });
beforeEach(() => { email = `auth-${randomUUID()}@example.invalid`; });
afterEach(async () => {
  // Auth requests commit through separate connections; delete only this test's
  // unique user. Foreign keys cascade to its accounts and sessions.
  if (email) await client.query('DELETE FROM "user" WHERE email = $1', [email]);
});
afterAll(async () => { await client.end(); });

function cookieHeader(response: Response) {
  return response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

function post(path: string, body: Record<string, unknown>, cookie = "", requestOrigin = origin) {
  return app.request(`${origin}/api/auth${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: requestOrigin, cookie },
    body: JSON.stringify(body),
  }, bindings);
}

async function getSession(cookie = "") {
  const response = await app.request(`${origin}/api/auth/get-session`, { headers: { cookie } }, bindings);
  expect(response.status).toBe(200);
  return response.json<{ user: AuthUser } | null>();
}

describe("Better Auth PostgreSQL integration", () => {
  it("registers, persists credentials and UUIDv7 IDs, logs in, validates cookies, and logs out", async () => {
    const signup = await post("/sign-up/email", {
      name: "FANS user", email, password,
      platformRole: "admin", status: "suspended", emailVerified: true,
    });
    expect(signup.status).toBe(200);
    const registered = await signup.json<{ user: AuthUser }>();
    expect(registered.user).toMatchObject({ email, platformRole: "user", status: "active", emailVerified: false });
    expect(registered.user).not.toHaveProperty("password");
    const signupCookie = cookieHeader(signup);
    expect(signupCookie).toContain("better-auth.session_token=");

    const { rows: [stored] } = await client.query<{
      id: string; name: string; user_version: number; account_version: number;
      session_version: number; provider: string; password: string;
    }>(`
      SELECT u.id, u.display_name AS name, uuid_extract_version(u.id) AS user_version,
        uuid_extract_version(a.id) AS account_version,
        uuid_extract_version(s.id) AS session_version,
        a.provider_id AS provider, a.password
      FROM "user" u
      JOIN account a ON a.user_id = u.id
      JOIN session s ON s.user_id = u.id
      WHERE u.email = $1
    `, [email]);
    expect(stored).toMatchObject({
      id: registered.user.id, name: "FANS user", provider: "credential",
      user_version: 7, account_version: 7, session_version: 7,
    });
    expect(stored.password).toEqual(expect.any(String));
    expect(stored.password).not.toBe(password);

    expect(await getSession(signupCookie)).toMatchObject({ user: { id: stored.id } });

    const escalation = await post("/update-user", { platformRole: "admin" }, signupCookie);
    expect(escalation.status).toBe(400);
    expect((await getSession(signupCookie))?.user.platformRole).toBe("user");

    expect((await post("/sign-out", {}, signupCookie)).status).toBe(200);
    expect(await getSession(signupCookie)).toBeNull();
    expect((await post("/sign-in/email", { email, password: "wrong-password" })).status).toBe(401);

    const login = await post("/sign-in/email", { email, password });
    expect(login.status).toBe(200);
    const loginCookie = cookieHeader(login);
    expect((await getSession(loginCookie))?.user.id).toBe(stored.id);
    expect(await getSession()).toBeNull();
    expect(await getSession("better-auth.session_token=forged")).toBeNull();

    const crossOrigin = await post("/sign-out", {}, loginCookie, "https://untrusted.example");
    expect(crossOrigin.status).toBe(403);
    expect((await getSession(loginCookie))?.user.id).toBe(stored.id);

    const logout = await post("/sign-out", {}, loginCookie);
    expect(logout.status).toBe(200);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await getSession(loginCookie)).toBeNull();
    const { rows: [sessions] } = await client.query<{ count: number }>(
      'SELECT count(*)::int AS count FROM session WHERE user_id = $1', [stored.id],
    );
    expect(sessions.count).toBe(0);
  });

  it("rejects an external signup callback before creating a user", async () => {
    const response = await post("/sign-up/email", {
      name: "FANS user", email, password, callbackURL: "https://untrusted.example/steal",
    });
    expect(response.status).toBe(403);
    const { rows } = await client.query('SELECT id FROM "user" WHERE email = $1', [email]);
    expect(rows).toEqual([]);
  });
});
