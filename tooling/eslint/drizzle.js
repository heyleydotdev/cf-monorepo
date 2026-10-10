import drizzle from "eslint-plugin-drizzle";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { drizzle },
    rules: {
      // Add any other drizzle handle you use to this list.
      "drizzle/enforce-delete-with-where": [
        "error",
        { drizzleObjectName: ["db"] },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        { drizzleObjectName: ["db"] },
      ],
    },
  },
]);
