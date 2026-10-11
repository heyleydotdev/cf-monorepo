import { defineConfig } from "eslint/config";

import base from "@acme/eslint/base";
import drizzle from "@acme/eslint/drizzle";

export default defineConfig([
  ...base,
  ...drizzle,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
