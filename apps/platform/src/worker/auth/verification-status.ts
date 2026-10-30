import { verify } from "hono/jwt";
import { z } from "zod";
import { emailSchema, type EmailVerificationStatus } from "../../shared/contracts/auth";

const claimsSchema = z.object({
  email: emailSchema,
  exp: z.number().int().positive(),
  // These claims belong to Better Auth's separate email-change flows.
  updateTo: z.undefined().optional(),
  requestType: z.undefined().optional(),
});

// Inspect a signed signup token without consuming it or changing the account.
export async function readVerificationStatus(
  token: string,
  secret: string,
  findAccount: (email: string) => Promise<{ emailVerified: boolean } | undefined>,
): Promise<EmailVerificationStatus> {
  let payload: unknown;
  try { payload = await verify(token, secret, "HS256"); }
  catch { return "invalid"; }
  const claims = claimsSchema.safeParse(payload);
  if (!claims.success) return "invalid";
  const account = await findAccount(claims.data.email);
  return account ? (account.emailVerified ? "verified" : "pending") : "invalid";
}
