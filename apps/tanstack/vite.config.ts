import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Vite reads the `~/*` alias from tsconfig paths only with this on.
  resolve: { tsconfigPaths: true },
  // The shared .env sits at the repo root, not in this app. envPrefix is left
  // at the Vite default of VITE_ so vite and turbo agree on which vars are
  // public without a second list to maintain.
  envDir: "../../",
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
