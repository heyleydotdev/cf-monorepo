import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

import { provide, setupFiles } from "@acme/vitest";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    // Scoped so a stray spec elsewhere under the app is not swept up.
    dir: "./test",
    setupFiles,
    provide,
  },
});
