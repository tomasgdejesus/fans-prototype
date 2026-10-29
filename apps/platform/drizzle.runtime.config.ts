import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig } from "drizzle-kit";
import config from "./drizzle.config";

// Node-only migration/Studio configuration. Never fall back to the application's
// pooled DATABASE_URL. Explicit environment values override the .dev.vars file.
const varsFile = new URL("./.dev.vars", import.meta.url);
const local = existsSync(varsFile) ? parseEnv(readFileSync(varsFile, "utf8")) : {};
const url = process.env.DATABASE_MIGRATION_URL ?? local.DATABASE_MIGRATION_URL;

if (!url) {
  throw new Error("Set DATABASE_MIGRATION_URL to a direct PostgreSQL endpoint in apps/platform/.dev.vars or the process environment.");
}

let target: URL;
try {
  target = new URL(url);
} catch {
  throw new Error("DATABASE_MIGRATION_URL must be a valid PostgreSQL connection string.");
}
if (!["postgres:", "postgresql:"].includes(target.protocol) || !target.hostname || target.pathname.length <= 1) {
  throw new Error("DATABASE_MIGRATION_URL must specify a PostgreSQL host and database.");
}

export default defineConfig({ ...config, dbCredentials: { url } });
