import type { AuthFailure } from "../../lib/auth-client";

// Only the auth service may establish success. Callback errors can explain
// failure; a token's presence alone never establishes its validity.
export function linkError(error: string | null): AuthFailure | null {
  if (!error) return null;
  if (error === "expired" || error === "TOKEN_EXPIRED") return "expiredLink";
  if (error === "used" || error === "TOKEN_ALREADY_USED") return "usedLink";
  return "invalidLink";
}
