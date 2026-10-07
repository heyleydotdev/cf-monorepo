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
    rules: {
      // A route module exports `Route` and keeps its component local, which is
      // exactly what this rule reports. Off here, on everywhere else.
      "react-refresh/only-export-components": "off",
    },
  },
]);
