// Cloudflare Workers docs: https://developers.cloudflare.com/workers/configuration/
// Non-secret values only: secrets are uploaded at deploy time, not declared here.
import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "nextjs",
    // vinext owns the App Router fetch handler; this only names where it lives.
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-10-18",
    compatibilityFlags: ["nodejs_compat"],
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
      DB: bindings.d1({
        // Placeholder so a clone runs against local D1 with no account. Replace
        // with the id from `wrangler d1 create acme-db`; the migrate scripts repeat it.
        id: "11111111-1111-4111-8111-111111111111",
        name: "acme-db",
      }),
    },
  }),
});
