import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/out/**",
    "**/build/**",
    "**/coverage/**",
    "**/next-env.d.ts",
    "**/playwright-report/**",
    "**/test-results/**",
    "packages/db/src/generated/**",
    ".sst/**",
    ".agents/**",
    "sst.config.ts",
  ]),

  // Storefront: Next.js rules (includes TypeScript + React).
  {
    files: ["apps/storefront/**/*.{js,mjs,ts,tsx}"],
    extends: [nextVitals, nextTs],
    settings: { next: { rootDir: "apps/storefront" } },
  },

  // Everything else: TypeScript rules.
  {
    files: ["apps/api/**/*.ts", "apps/admin/**/*.{ts,tsx}", "packages/**/*.ts", "*.{js,mjs,ts}"],
    extends: [tseslint.configs.recommended],
  },

  // Admin is a React app too.
  {
    files: ["apps/admin/**/*.tsx"],
    extends: [reactHooks.configs.flat.recommended],
  },
]);
