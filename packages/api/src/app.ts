import { Hono } from "hono";

/**
 * The routes, as a Hono app the host mounts:
 * `app.route("/api", api)`. Routes live here so the Worker stays a thin entry.
 *
 * `api` is a concrete const, not the result of a factory, because `AppType` is
 * the RPC contract and the client infers paths and response bodies from it. The
 * path literal in the type has to survive into the emitted declaration, which a
 * factory return type loses.
 */
export const api = new Hono().get("/health", (c) => c.json({ ok: true }));

export type AppType = typeof api;

export function createApi() {
  return api;
}
