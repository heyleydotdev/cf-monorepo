import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vitest/config";

import { provide, setupFiles, testTimeout } from "@acme/vitest";

export default defineConfig({
  // Vite reads the `~/*` alias from tsconfig paths only with this on.
  // Without it here, a test that loads a route module through the router cannot
  // resolve the app's own imports — see README.
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
    // Provides the `#tanstack-start-entry` virtual module createServerFn resolves through.
    tanstackStart(),
  ],
  test: {
    // Scoped so a stray spec elsewhere under the app is not swept up.
    dir: "./test",
    testTimeout,
    setupFiles,
    provide,
  },
});
