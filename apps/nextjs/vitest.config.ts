import { fileURLToPath } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

import { provide, setupFiles, testTimeout } from "@acme/vitest";

export default defineConfig({
  // Vite reads the `~/*` alias from tsconfig paths only with this on.
  resolve: {
    tsconfigPaths: true,
    // `server-only` throws unless the bundler picks its `react-server` export;
    // these specs import the actions directly, so the marker only has to resolve.
    alias: {
      "server-only": fileURLToPath(
        new URL("./test/server-only.ts", import.meta.url),
      ),
    },
  },
  plugins: [
    cloudflareTest({
      // The app has no wrangler.jsonc, and the plugin cannot load
      // cloudflare.config.ts under Bun, so the test worker restates its bindings.
      // Its date trails the app's 2026-10-18: the pool pins an older workerd.
      miniflare: {
        compatibilityDate: "2026-09-16",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
      },
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
