import { createAuthClient } from "better-auth/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { EmailInput, LoginInput, RegistrationInput, ResetPasswordInput } from "../../shared/contracts/auth";
import type { Auth } from "../../worker/auth";
import type { AuthSession } from "../../worker/env";
import { apiClient } from "./api-client";

// The SDK handles cookies; TanStack Query owns the frontend session state.
const betterAuthClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [inferAdditionalFields<Auth>()],
  fetchOptions: { credentials: "same-origin", cache: "no-store" },
});

export type PublicSession = { userId: string } & Pick<AuthSession["user"], "platformRole" | "status" | "emailVerified">;
export type AuthFailure = "unavailable" | "credentials" | "verificationRequired" | "failed" | "rateLimited" | "invalidLink" | "expiredLink" | "usedLink";
export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure };
export type EmailRequestResult = { ok: true } | { ok: false; reason: "unavailable" | "failed" | "rateLimited" };

type ServiceError = { code?: string; status?: number };

function authResult(error: ServiceError | null): AuthResult {
  if (!error) return { ok: true };
  if (error.status === 429) return { ok: false, reason: "rateLimited" };
  if (error.status === 0 || (error.status !== undefined && error.status >= 500)) return { ok: false, reason: "unavailable" };
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD": return { ok: false, reason: "credentials" };
    case "EMAIL_NOT_VERIFIED": return { ok: false, reason: "verificationRequired" };
    case "TOKEN_EXPIRED": return { ok: false, reason: "expiredLink" };
    case "TOKEN_ALREADY_USED": return { ok: false, reason: "usedLink" };
    case "INVALID_TOKEN":
    case "INVALID_RESET_TOKEN": return { ok: false, reason: "invalidLink" };
    default: return { ok: false, reason: "failed" };
  }
}

function emailResult(error: ServiceError | null): EmailRequestResult {
  // Keep account-existence failures neutral if a service version returns them.
  if (error?.code === "USER_NOT_FOUND" || error?.code === "EMAIL_NOT_FOUND") return { ok: true };
  const result = authResult(error);
  if (result.ok) return result;
  return { ok: false, reason: result.reason === "unavailable" || result.reason === "rateLimited" ? result.reason : "failed" };
}

export interface PublicAuthClient {
  configured: boolean;
  getEmailCapabilities(signal?: AbortSignal): Promise<{ emailVerification: boolean; passwordReset: boolean }>;
  getSession(signal?: AbortSignal): Promise<PublicSession | null>;
  signIn(input: LoginInput): Promise<AuthResult>;
  register(input: RegistrationInput, verificationPath?: string): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  requestPasswordReset(input: EmailInput & { redirectTo: string }): Promise<EmailRequestResult>;
  resetPassword(input: ResetPasswordInput): Promise<AuthResult>;
  verifyEmail(input: { token: string }): Promise<AuthResult>;
  resendVerification(input: EmailInput & { redirectTo: string }): Promise<EmailRequestResult>;
}

export const authClient: PublicAuthClient = {
  configured: true,
  async getEmailCapabilities(signal) {
    const response = await apiClient.api["auth-capabilities"].$get({}, { init: { signal, cache: "no-store" } });
    if (response.status !== 200) throw new Error("Email capability check failed.");
    return response.json();
  },
  async getSession(signal) {
    const { data, error } = await betterAuthClient.getSession({ fetchOptions: { signal } });
    // An outage must not be treated as a signed-out session.
    if (error) throw new Error("Session check failed.");
    return data ? {
      userId: data.user.id,
      platformRole: data.user.platformRole,
      status: data.user.status,
      emailVerified: data.user.emailVerified,
    } : null;
  },
  async signIn(input) {
    const { error } = await betterAuthClient.signIn.email(input);
    return authResult(error);
  },
  async register(input, verificationPath = "/verify-email") {
    const callbackURL = new URL(verificationPath, window.location.origin).href;
    const { error } = await betterAuthClient.signUp.email({ ...input, name: "FANS user", callbackURL });
    return authResult(error);
  },
  async signOut() {
    const { error } = await betterAuthClient.signOut();
    return authResult(error);
  },
  async requestPasswordReset({ email, redirectTo }) {
    const { error } = await betterAuthClient.requestPasswordReset({ email, redirectTo });
    return emailResult(error);
  },
  async resetPassword({ token, password }) {
    const { error } = await betterAuthClient.resetPassword({ token, newPassword: password });
    return authResult(error);
  },
  async verifyEmail({ token }) {
    // No callbackURL: the SDK returns the validation result without navigating.
    const { error } = await betterAuthClient.verifyEmail({ query: { token } });
    return authResult(error);
  },
  async resendVerification({ email, redirectTo }) {
    const { error } = await betterAuthClient.sendVerificationEmail({ email, callbackURL: redirectTo });
    return emailResult(error);
  },
};
