import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "worker-configuration.d.ts"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: "latest" },
  },
  {
    files: ["src/react-app/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/worker/**"],
          allowTypeImports: true,
          message: "Frontend code may import backend types only, never backend runtime code.",
        }],
      }],
    },
  },
  {
    files: ["src/worker/**/*.ts"],
    languageOptions: { globals: globals.worker },
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/react-app/**"],
          message: "Put code shared by the frontend and backend under src/shared.",
        }],
      }],
    },
  },
  {
    files: ["src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/worker/**", "**/react-app/**"],
          message: "Shared modules must be independent of frontend and backend modules.",
        }],
      }],
    },
  },
  {
    files: ["*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
);
