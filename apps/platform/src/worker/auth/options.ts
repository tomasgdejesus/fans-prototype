import type { BetterAuthOptions } from "better-auth";

// Shared by the runtime factory and any future schema-generation entry point.
export const authOptions = {
  appName: "FANS",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
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
