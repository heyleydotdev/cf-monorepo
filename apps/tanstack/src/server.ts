import startHandler, {
  createServerEntry,
} from "@tanstack/react-start/server-entry";
import { Hono } from "hono";

import { createApi } from "@acme/api";

/**
 * The Worker entry point, named by `main` in wrangler.jsonc.
 *
 * Hono answers /api, using the same `createApi` apps/server mounts, then
 * everything else falls through to Start's handler for SSR.
 *
 * The fallthrough has to be explicit. A file route with a `server.handlers`
 * entry cannot catch all paths, because Start skips those handlers when the
 * match consumed a splat param, so `/api/$` never fires. Wrapping the handler
 * is the only way to claim a prefix.
 */
const app = new Hono();

app.route("/api", createApi());

app.all("*", (c) => startHandler.fetch(c.req.raw));

export default createServerEntry({ fetch: app.fetch });
