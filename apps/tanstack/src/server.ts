import startHandler, {
  createServerEntry,
} from "@tanstack/react-start/server-entry";

/**
 * Entry point, named by `main` in wrangler.jsonc, and it must stay a local file:
 * the vite plugin resolves a package specifier there but the vitest pool treats it
 * as a path. Start answers everything: loaders and server functions run in-process,
 * and `routes/api/rpc.$.ts` serves the same procedures over RPC to the browser.
 */
export default createServerEntry({ fetch: startHandler.fetch });
