// UI boundary only. Replace with the Better Auth adapter when the server is ready.
// Never infer a session or successful token validation from a URL or local storage.
export type PublicSession = { userId: string };
export type AuthFailure = "unavailable" | "credentials" | "verificationRequired" | "failed" | "rateLimited" | "invalidLink" | "expiredLink" | "usedLink";
export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure };
// Normalize unknown-account responses to success, so recovery cannot enumerate accounts.
export type EmailRequestResult = { ok: true } | { ok: false; reason: "unavailable" | "failed" | "rateLimited" };

export interface PublicAuthClient {
  configured: boolean;
  canResendVerification: boolean;
  getSession(): Promise<PublicSession | null>;
  signIn(input: { email: string; password: string }): Promise<AuthResult>;
  register(input: { name: string; email: string; password: string }): Promise<AuthResult>;
  requestPasswordReset(input: { email: string; redirectTo: string }): Promise<EmailRequestResult>;
  resetPassword(input: { token: string; password: string }): Promise<AuthResult>;
  verifyEmail(input: { token: string }): Promise<AuthResult>;
  resendVerification(input: { email: string; redirectTo: string }): Promise<EmailRequestResult>;
}

const unavailable = async (): Promise<{ ok: false; reason: "unavailable" }> => ({ ok: false, reason: "unavailable" });

export const authClient: PublicAuthClient = {
  configured: false,
  canResendVerification: false,
  getSession: async () => null,
  signIn: unavailable,
  register: unavailable,
  requestPasswordReset: unavailable,
  resetPassword: unavailable,
  verifyEmail: unavailable,
  resendVerification: unavailable,
};
