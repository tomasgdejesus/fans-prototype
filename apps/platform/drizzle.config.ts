import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/worker/db/schema/index.ts",
  out: "./drizzle/postgresql",
});
