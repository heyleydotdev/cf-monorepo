import { defineConfig } from "eslint/config";

import nextjs from "@acme/eslint/nextjs";

export default defineConfig([
  ...nextjs,
  {
    files: ["**/*.{ts,tsx}"],
    // The next/* rules that scan for `pages` need this: editors and a
    // repo-root ESLint run both cwd elsewhere in a monorepo.
    settings: {
      next: { rootDir: import.meta.dirname },
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
