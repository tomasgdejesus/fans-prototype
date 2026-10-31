import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => ({
  getSession: vi.fn(), signIn: { email: vi.fn() }, signUp: { email: vi.fn() },
  signOut: vi.fn(), requestPasswordReset: vi.fn(), resetPassword: vi.fn(),
  verifyEmail: vi.fn(), sendVerificationEmail: vi.fn(), updateUser: vi.fn(), changeEmail: vi.fn(),
}));
const statusRequest = vi.hoisted(() => vi.fn());
const emailChangeStatusRequest = vi.hoisted(() => vi.fn());
vi.mock("better-auth/client", () => ({ createAuthClient: vi.fn(() => sdk) }));
vi.mock("../../../lib/api-client", () => ({ apiClient: { api: { auth: { "verification-status": { $post: statusRequest }, "email-change-status": { $post: emailChangeStatusRequest } } } } }));

import { createAuthClient } from "better-auth/client";
import { authClient } from "../../../lib/auth-client";

beforeEach(() => {
  for (const method of [sdk.getSession, sdk.signIn.email, sdk.signUp.email, sdk.signOut,
    sdk.requestPasswordReset, sdk.resetPassword, sdk.verifyEmail, sdk.sendVerificationEmail, sdk.updateUser, sdk.changeEmail]) method.mockReset();
  statusRequest.mockReset();
  emailChangeStatusRequest.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Better Auth frontend adapter", () => {
  it("uses a same-origin client without browser-stored tokens", () => {
    expect(createAuthClient).toHaveBeenCalledWith(expect.objectContaining({
      basePath: "/api/auth",
      disableDefaultFetchPlugins: true,
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
      id: "user-1", name: "FANS user", email: "learner@example.com", platformRole: "admin", status: "suspended", emailVerified: true,
    } } });
    const signal = new AbortController().signal;
    expect(await authClient.getSession(signal)).toEqual({
      userId: "user-1", name: "FANS user", email: "learner@example.com", platformRole: "admin", status: "suspended", emailVerified: true,
    });
    expect(sdk.getSession).toHaveBeenCalledWith({ fetchOptions: { signal } });
  });

  it("does not expose a legacy unverified session to the application", async () => {
    sdk.getSession.mockResolvedValue({ error: null, data: { user: { id: "old-user", emailVerified: false } } });
    expect(await authClient.getSession()).toBeNull();
  });

  it("includes the verification destination on returning-user sign-in", async () => {
    sdk.signIn.email.mockResolvedValue({ error: { code: "EMAIL_NOT_VERIFIED", status: 403 } });
    const input = { email: "learner@example.com", password: "example-password" };
    const path = "/verify-email?returnTo=%2Fcheckout";
    expect(await authClient.signIn(input, path)).toEqual({ ok: false, reason: "verificationRequired" });
    expect(sdk.signIn.email).toHaveBeenCalledWith({ ...input, callbackURL: new URL(path, window.location.origin).href });
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

  it("reads verified status without consuming the token or including it in a URL", async () => {
    statusRequest.mockResolvedValue(Response.json({ status: "verified" }));
    const signal = new AbortController().signal;
    expect(await authClient.getVerificationStatus("signed-token", signal)).toBe("verified");
    expect(statusRequest).toHaveBeenCalledExactlyOnceWith({ json: { token: "signed-token" } }, {
      init: { signal, cache: "no-store", credentials: "same-origin" },
    });
    expect(sdk.verifyEmail).not.toHaveBeenCalled();
  });

  it("does not turn a failed status lookup into a pending verification", async () => {
    statusRequest.mockResolvedValue(new Response(null, { status: 503 }));
    await expect(authClient.getVerificationStatus("signed-token")).rejects.toThrow("Verification status check failed.");
  });

  it("uses native profile and email-change actions without altering the current session", async () => {
    sdk.updateUser.mockResolvedValue({ error: null });
    sdk.changeEmail.mockResolvedValue({ error: null });
    expect(await authClient.updateDisplayName({ name: "Tomas" })).toEqual({ ok: true });
    expect(sdk.updateUser).toHaveBeenCalledExactlyOnceWith({ name: "Tomas" });
    expect(await authClient.changeEmail({ email: "new@example.com" })).toEqual({ ok: true });
    expect(sdk.changeEmail).toHaveBeenCalledExactlyOnceWith({ newEmail: "new@example.com" });
    expect(sdk.getSession).not.toHaveBeenCalled();
  });

  it("reads the signed email-change purpose without consuming the link", async () => {
    emailChangeStatusRequest.mockResolvedValue(Response.json({ status: "confirmation" }));
    const signal = new AbortController().signal;
    expect(await authClient.getEmailChangeStatus("signed-token", signal)).toBe("confirmation");
    expect(emailChangeStatusRequest).toHaveBeenCalledExactlyOnceWith({ json: { token: "signed-token" } }, {
      init: { signal, cache: "no-store", credentials: "same-origin" },
    });
    expect(sdk.verifyEmail).not.toHaveBeenCalled();
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
