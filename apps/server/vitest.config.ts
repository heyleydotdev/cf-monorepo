import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

import { provide, setupFiles, testTimeout } from "@acme/vitest";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    // Scoped so a stray spec elsewhere under the app is not swept up.
    dir: "./test",
    testTimeout,
    setupFiles,
    provide,
    // A spec that fails mid-test must not leave a spy installed for the next one.
    restoreMocks: true,
  },
});
