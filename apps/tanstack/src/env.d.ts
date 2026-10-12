/// <reference types="vite/client" />

// Declaring this makes vite drop its `Record<string, any>` fallback on
// import.meta.env, so a misspelled variable fails typecheck instead of
// inlining as undefined and throwing `Invalid URL` in the browser.
interface ViteTypeOptions {
  strictImportMetaEnv: true;
}

// A public env var needs an ImportMetaEnv entry here. None yet: the notes api
// runs as server functions in the same Worker, so no origin is needed. Turbo
// already hashes VITE_* for Vite packages, so no turbo.json change goes with it.
