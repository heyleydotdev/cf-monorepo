import startHandler, {
  createServerEntry,
} from "@tanstack/react-start/server-entry";

/**
 * The Worker entry point, named by `main` in wrangler.jsonc.
 *
 * This does exactly what `@tanstack/react-start/server-entry` does by default,
 * and it has to stay a local file for that reason. `main` accepts a package
 * specifier and the Cloudflare Vite plugin resolves one, but the Cloudflare
 * vitest pool resolves the same field as a filesystem path. Point it at the
 * package and the build passes while every spec in this app fails to load. A
 * local path is the one value both tools agree on. Deleting this file looks
 * like a cleanup and breaks the test suite.
 *
 * Start answers everything. There is no Hono here: the notes api is reached
 * through server functions in src/lib/notes.ts, which run in this same Worker.
 * Mounting `createApi` as well would mean an internal loader fetching its own
 * origin over HTTP, for no gain. This file did once mount it; dropping that
 * left the rest of the wiring unchanged.
 *
 * The external HTTP surface is `createApi` from @acme/api, mounted by
 * apps/server. Both reach the same @acme/core service.
 */
export default createServerEntry({ fetch: startHandler.fetch });
