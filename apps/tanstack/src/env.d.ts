/// <reference types="vite/client" />

// Declaring this makes vite drop its `Record<string, any>` fallback on
// import.meta.env, so a misspelled variable fails typecheck instead of
// inlining as undefined and throwing `Invalid URL` in the browser.
interface ViteTypeOptions {
  strictImportMetaEnv: true;
}

// Every client-exposed var goes here. Turbo already hashes VITE_* for Vite
// packages, so no turbo.json change is needed alongside a new entry.
interface ImportMetaEnv {
  readonly VITE_TANSTACK_BASE_URL: string;
}
