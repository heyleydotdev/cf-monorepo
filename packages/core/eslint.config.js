import { defineConfig } from "eslint/config";

import base from "@acme/eslint/base";

export default defineConfig([
  ...base,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
