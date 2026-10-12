import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vitest/config";

import { provide, setupFiles } from "@acme/vitest";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
    // Provides the `#tanstack-start-entry` virtual module that createServerFn
    // resolves through, without which importing src/lib/notes throws.
    tanstackStart(),
  ],
  test: {
    // Scoped so a stray spec elsewhere under the app is not swept up.
    dir: "./test",
    setupFiles,
    provide,
  },
});
