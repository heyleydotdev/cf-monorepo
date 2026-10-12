import startHandler, {
  createServerEntry,
} from "@tanstack/react-start/server-entry";

/**
 * The Worker entry point, named by `main` in wrangler.jsonc.
 *
 * Start answers everything. There is no Hono here: the notes api is reached
 * through server functions in src/lib/notes.ts, which run in this same Worker.
 * Mounting `createApi` as well would mean an internal loader fetching its own
 * origin over HTTP, for no gain.
 *
 * The external HTTP surface is `createApi` from @acme/api, mounted by
 * apps/server. Both reach the same @acme/core service.
 */
export default createServerEntry({ fetch: startHandler.fetch });
