import next from "@next/eslint-plugin-next";
import { defineConfig } from "eslint/config";

import base from "./base.js";

export default defineConfig([
  ...base,
  {
    files: ["**/*.{ts,tsx}"],
    extends: [next.configs["core-web-vitals"]],
  },
]);
