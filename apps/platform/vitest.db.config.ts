import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/worker/test/integration/**/*.test.ts"],
    fileParallelism: false,
    // Allow the pooled connection/query deadlines to report their own errors.
    testTimeout: 30_000,
    hookTimeout: 15_000,
  },
});
