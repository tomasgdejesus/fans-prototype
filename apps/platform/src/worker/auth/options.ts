import type { BetterAuthOptions } from "better-auth";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../shared/constants/auth";

/*
TODO:
- multiple base URLs if needed
- secondary storage (e.g. Cloudflare KV, if useful)
- OAuth social providers
- plugins that are useful
- rate limiting
*/

// Shared by the runtime factory and any future schema-generation entry point.
export const authOptions = {
  appName: "FANS",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    maxPasswordLength: PASSWORD_MAX_LENGTH,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    changeEmail: { enabled: true, updateEmailWithoutVerification: false },
    additionalFields: {
      platformRole: { type: "string", defaultValue: "user", input: false },
      status: { type: "string", defaultValue: "active", input: false },
    },
  },
  // Read sessions from the database so revocation is effective immediately.
  session: { cookieCache: { enabled: false } },
  advanced: {
    // Better Auth otherwise skips origin checks in test environments.
    disableOriginCheck: false,
    disableCSRFCheck: false,
    database: { generateId: false },
  },
} satisfies BetterAuthOptions;
