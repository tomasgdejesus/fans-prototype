import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/worker/test/maildev/**/*.test.ts"],
    testTimeout: 20_000,
  },
});
