import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS } from "../../shared/constants/auth";
import { displayNameInputSchema, emailSchema } from "../../shared/contracts/auth";
import type { Database } from "../db/client";
import * as authSchema from "../db/schema/auth";
import { authOptions } from "./options";
import { emailChangePageURL, sendAuthEmail, verificationPageURL, type AuthEmailDelivery } from "../email/auth";
import { readVerificationClaims } from "./verification-status";

export interface AuthConfig {
  baseURL: string;
  secret: string;
}

// Accept a single explicit application origin, independent of the hosting provider.
export function readAuthConfig(values: Partial<AuthConfig>): AuthConfig | null {
  if (!values.baseURL || !values.secret || values.secret.trim().length < 32) return null;

  try {
    const url = new URL(values.baseURL);
    if (!["http:", "https:"].includes(url.protocol)
      || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return { baseURL: url.origin, secret: values.secret };
  } catch {
    return null;
  }
}

export function createAuth(db: Database, config: AuthConfig, email: AuthEmailDelivery) {
  const validated = readAuthConfig(config);
  if (!validated) throw new Error("Invalid authentication configuration.");

  return betterAuth({
    ...authOptions,
    baseURL: validated.baseURL,
    secret: validated.secret,
    trustedOrigins: [validated.baseURL],
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/update-user" && ctx.path !== "/change-email") return;
        const session = await getSessionFromCtx<{ status: string }>(ctx);
        if (!session?.user.emailVerified) throw new APIError("UNAUTHORIZED", { message: "Authentication required." });
        if (session.user.status !== "active") throw new APIError("FORBIDDEN", { message: "Account is inactive." });
        if (ctx.path === "/update-user") {
          const parsed = displayNameInputSchema.safeParse(ctx.body);
          if (!parsed.success) throw new APIError("BAD_REQUEST", { message: "Enter a display name of 1 to 100 characters." });
          return { context: { ...ctx, body: parsed.data } };
        }
        const parsed = emailSchema.safeParse(ctx.body?.newEmail);
        if (!parsed.success) throw new APIError("BAD_REQUEST", { message: "Enter a valid email address." });
        return { context: { ...ctx, body: { ...ctx.body, newEmail: parsed.data } } };
      }),
    },
    user: {
      ...authOptions.user,
      changeEmail: {
        ...authOptions.user.changeEmail,
        sendChangeEmailConfirmation: async ({ user, newEmail, token }) => {
          await sendAuthEmail(email, "emailChangeConfirmation", user.email, emailChangePageURL(validated.baseURL, token), newEmail);
        },
      },
    },
    emailVerification: {
      expiresIn: EMAIL_VERIFICATION_EXPIRES_IN_SECONDS,
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url, token }) => {
        const claims = await readVerificationClaims(token, validated.secret);
        if (claims?.requestType === "change-email-verification") {
          await sendAuthEmail(email, "emailChangeVerification", user.email, emailChangePageURL(validated.baseURL, token));
        } else {
          await sendAuthEmail(email, "verification", user.email, verificationPageURL(validated.baseURL, token, url));
        }
      },
      afterEmailVerification: async (user, request) => {
        const token = request ? new URL(request.url).searchParams.get("token") : null;
        const claims = token ? await readVerificationClaims(token, validated.secret) : null;
        if (claims?.updateTo) return;
        await sendAuthEmail(email, "welcome", user.email, new URL("/login", validated.baseURL).href);
      },
    },
    emailAndPassword: {
      ...authOptions.emailAndPassword,
      sendResetPassword: async ({ user, url }) => {
        await sendAuthEmail(email, "passwordReset", user.email, url);
      },
    },
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
      transaction: true,
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
