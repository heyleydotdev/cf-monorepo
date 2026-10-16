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
      // shadcn exports each component's cva variants beside the component so a
      // consumer can compose them, which is the rule's non-component-export case.
      "react-refresh/only-export-components": "off",
    },
  },
]);
