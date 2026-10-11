import { Hono } from "hono";

import type { APIBindings } from "./env";
import { notesRoutes } from "./routes/notes";

/**
 * The routes, as a Hono app the host mounts:
 * `app.route("/api", api)`. Routes live here so the Worker stays a thin entry.
 *
 * `api` is a concrete const, not the result of a factory, because `ApiType` is
 * the RPC contract and the client infers paths and response bodies from it. The
 * path literal in the type has to survive into the emitted declaration, which a
 * factory return type loses. Sub-apps mount through `route()`, which merges
 * their paths at the type level, so the const holds.
 *
 * Consumers import `createApi` from the package root; nothing imports the route
 * modules or the app const directly.
 */
export const api = new Hono<{ Bindings: APIBindings }>()
  .get("/health", (c) => c.json({ ok: true }))
  .route("/", notesRoutes);

export type ApiType = typeof api;

export function createApi() {
  return api;
}
