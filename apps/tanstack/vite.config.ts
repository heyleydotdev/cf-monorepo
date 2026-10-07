import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // So Vite resolves the `~/*` alias declared in tsconfig paths.
  resolve: { tsconfigPaths: true },
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
