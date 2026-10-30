import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  getSession: vi.fn(), signIn: { email: vi.fn() }, signUp: { email: vi.fn() },
  signOut: vi.fn(), requestPasswordReset: vi.fn(), resetPassword: vi.fn(),
  verifyEmail: vi.fn(), sendVerificationEmail: vi.fn(),
}));
vi.mock("better-auth/client", () => ({ createAuthClient: vi.fn(() => sdk) }));

import { createAuthClient } from "better-auth/client";
import { authClient } from "../../../lib/auth-client";

beforeEach(() => {
  for (const method of [sdk.getSession, sdk.signIn.email, sdk.signUp.email, sdk.signOut,
    sdk.requestPasswordReset, sdk.resetPassword, sdk.verifyEmail, sdk.sendVerificationEmail]) method.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Better Auth frontend adapter", () => {
  it("uses a same-origin client without browser-stored tokens", () => {
    expect(createAuthClient).toHaveBeenCalledWith(expect.objectContaining({
      basePath: "/api/auth",
      fetchOptions: { credentials: "same-origin", cache: "no-store" },
    }));
  });

  it("supplies the internal name for email-only registration", async () => {
    sdk.signUp.email.mockResolvedValue({ error: null });
    const input = { email: "learner@example.com", password: "example-password" };
    expect(await authClient.register(input)).toEqual({ ok: true });
    expect(sdk.signUp.email).toHaveBeenCalledWith({ ...input, name: "FANS user", callbackURL: new URL("/verify-email", window.location.origin).href });
  });

  it("uses server-owned role and account status in session results", async () => {
    sdk.getSession.mockResolvedValue({ error: null, data: { user: {
      id: "user-1", platformRole: "admin", status: "suspended", emailVerified: true,
    } } });
    const signal = new AbortController().signal;
    expect(await authClient.getSession(signal)).toEqual({
      userId: "user-1", platformRole: "admin", status: "suspended", emailVerified: true,
    });
    expect(sdk.getSession).toHaveBeenCalledWith({ fetchOptions: { signal } });
  });

  it("distinguishes a signed-out response from a service failure", async () => {
    sdk.getSession.mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { status: 503 } });
    expect(await authClient.getSession()).toBeNull();
    await expect(authClient.getSession()).rejects.toThrow("Session check failed");
  });

  it.each([
    [{ code: "INVALID_EMAIL_OR_PASSWORD", status: 401 }, "credentials"],
    [{ code: "EMAIL_NOT_VERIFIED", status: 403 }, "verificationRequired"],
    [{ code: "TOO_MANY_REQUESTS", status: 429 }, "rateLimited"],
    [{ status: 503 }, "unavailable"],
    [{ code: "UNEXPECTED", status: 400 }, "failed"],
  ] as const)("normalizes authentication errors: %o", async (error, reason) => {
    sdk.signIn.email.mockResolvedValue({ error });
    expect(await authClient.signIn({ email: "learner@example.com", password: "wrong" })).toEqual({ ok: false, reason });
  });

  it("keeps unknown-account recovery neutral and uses the SDK's redirect field", async () => {
    sdk.requestPasswordReset.mockResolvedValue({ error: { code: "USER_NOT_FOUND", status: 400 } });
    const input = { email: "unknown@example.com", redirectTo: "https://fans.invalid/reset-password" };
    expect(await authClient.requestPasswordReset(input)).toEqual({ ok: true });
    expect(sdk.requestPasswordReset).toHaveBeenCalledWith(input);
  });

  it("uses Better Auth password-reset and verification payloads", async () => {
    sdk.resetPassword.mockResolvedValue({ error: { code: "INVALID_TOKEN", status: 400 } });
    sdk.verifyEmail.mockResolvedValue({ error: null });
    expect(await authClient.resetPassword({ token: "token", password: "new-password" })).toEqual({ ok: false, reason: "invalidLink" });
    expect(sdk.resetPassword).toHaveBeenCalledWith({ token: "token", newPassword: "new-password" });
    expect(await authClient.verifyEmail({ token: "token" })).toEqual({ ok: true });
    expect(sdk.verifyEmail).toHaveBeenCalledWith({ query: { token: "token" } });
  });
});
