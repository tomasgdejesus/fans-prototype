import { verify } from "hono/jwt";
import { z } from "zod";
import { emailSchema, type EmailChangeStatus, type EmailVerificationStatus } from "../../shared/contracts/auth";

const claimsSchema = z.object({
  email: emailSchema,
  exp: z.number().int().positive(),
  updateTo: emailSchema.optional(),
  requestType: z.enum(["change-email-confirmation", "change-email-verification"]).optional(),
});

// Better Auth still owns token consumption and all account mutations.
export async function readVerificationClaims(token: string, secret: string) {
  try {
    const parsed = claimsSchema.safeParse(await verify(token, secret, "HS256"));
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

// Inspect a signed signup token without consuming it or changing the account.
export async function readVerificationStatus(
  token: string,
  secret: string,
  findAccount: (email: string) => Promise<{ emailVerified: boolean } | undefined>,
): Promise<EmailVerificationStatus> {
  const claims = await readVerificationClaims(token, secret);
  // Never classify an email-change token as an already-verified signup.
  if (!claims || claims.updateTo || claims.requestType) return "invalid";
  const account = await findAccount(claims.email);
  return account ? (account.emailVerified ? "verified" : "pending") : "invalid";
}

export async function readEmailChangeStatus(
  token: string,
  secret: string,
  findAccount: (email: string) => Promise<{ emailVerified: boolean } | undefined>,
): Promise<EmailChangeStatus> {
  const claims = await readVerificationClaims(token, secret);
  if (!claims?.updateTo || !claims.requestType) return "invalid";
  const account = await findAccount(claims.email);
  if (!account?.emailVerified) return "invalid";
  return claims.requestType === "change-email-confirmation" ? "confirmation" : "verification";
}
