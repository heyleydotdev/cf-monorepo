import { hc } from "hono/client";

import type { ApiType } from "./app";

/**
 * The client type, resolved once at build time rather than on every call site.
 * Callers get the routes of this package baked in: a path or method that does
 * not exist fails to compile, and a response body is inferred instead of
 * `unknown`.
 *
 * `baseUrl` must be absolute on the server, where a relative URL cannot be
 * fetched. In the browser a relative path is fine.
 */
export type Client = ReturnType<typeof hc<ApiType>>;

export function createApiClient(baseUrl = "/api"): Client {
  return hc<ApiType>(baseUrl);
}
