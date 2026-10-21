import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { defineConfig } from "drizzle-kit";
import config from "./drizzle.config";

// Drizzle Kit runs in Node, outside Wrangler. Load server-only local values
// explicitly; an exported DATABASE_URL takes precedence (for CI/remote runs).
const varsFile = new URL("./.dev.vars", import.meta.url);
const local = existsSync(varsFile) ? parseEnv(readFileSync(varsFile, "utf8")) : {};
const url = process.env.DATABASE_URL ?? local.DATABASE_URL;

if (!url) {
  throw new Error("Set DATABASE_URL in apps/platform/.dev.vars or the process environment.");
}

if (!["postgres:", "postgresql:"].includes(new URL(url).protocol)) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
}

export default defineConfig({ ...config, dbCredentials: { url } });
