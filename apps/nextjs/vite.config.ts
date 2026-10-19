import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  // The shared .env sits at the repo root, not in this app. envPrefix stays at
  // the Vite default; vinext inlines NEXT_PUBLIC_* for the browser on its own.
  envDir: "../../",
  plugins: [
    vinext({
      // Build-time prerender. A route that reads a binding opts out with
      // `export const dynamic = "force-dynamic"`.
      prerender: { routes: "*" },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: 3002,
  },
});
