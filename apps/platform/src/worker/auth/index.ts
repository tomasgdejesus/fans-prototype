import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "../db/client";
import * as authSchema from "../db/schema/auth";
import { authOptions } from "./options";

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

export function createAuth(db: Database, config: AuthConfig) {
  const validated = readAuthConfig(config);
  if (!validated) throw new Error("Invalid authentication configuration.");

  return betterAuth({
    ...authOptions,
    baseURL: validated.baseURL,
    secret: validated.secret,
    trustedOrigins: [validated.baseURL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: authSchema,
      transaction: true,
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
