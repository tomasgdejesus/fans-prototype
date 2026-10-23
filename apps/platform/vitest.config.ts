import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: "react-app",
          environment: "jsdom",
          include: ["src/react-app/test/**/*.test.{ts,tsx}"],
          setupFiles: ["src/react-app/test/setup.ts"],
        },
      },
      {
        test: {
          name: "worker",
          environment: "node",
          include: ["src/worker/test/**/*.test.ts"],
          exclude: ["src/worker/test/integration/**"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/react-app/**/*.{ts,tsx}", "src/worker/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/test/**",
        "src/react-app/main.tsx",
        "src/worker/index.ts",
      ],
    },
  },
});
