import { defineConfig } from "eslint/config";

import react from "@acme/eslint/react";

export default defineConfig([
  ...react,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // A route module exports `Route` and keeps its component local, which is
      // the rule's localComponents case.
      "react-refresh/only-export-components": "off",
    },
  },
]);
