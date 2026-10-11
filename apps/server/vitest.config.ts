import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

import { d1Migrations } from "./test/migrations";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    setupFiles: ["./test/apply-migrations.ts"],
    // Read in node, consumed in the worker: see test/migrations.ts.
    provide: { migrations: d1Migrations },
  },
});
