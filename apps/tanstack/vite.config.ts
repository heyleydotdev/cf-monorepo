import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // So Vite resolves the `~/*` alias declared in tsconfig paths.
  resolve: { tsconfigPaths: true },
  // The shared .env sits at the repo root, not in this app.
  envDir: "../../",
  // Vite exposes only VITE_ prefixed vars by default; this app reads
  // TANSTACK_BASE_URL.
  envPrefix: ["VITE_", "TANSTACK_"],
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  plugins: [
    devtools(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    // Start's plugin must come before the React plugin.
    tanstackStart(),
    viteReact(),
  ],
});
