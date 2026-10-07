import { defineConfig } from "eslint/config";

import react from "@acme/eslint/react";

export default defineConfig([
  ...react,
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
