import "server-only";

import { env } from "cloudflare:workers";

import { createRpcServer } from "@acme/api/server";

/**
 * The procedures in-process, for the server actions. Built per call because vinext
 * proxies `env` during build-time prerendering and throws on any access: reading a
 * binding at module scope would fail the build for every page that imports this.
 */
export function getRpcServer() {
  return createRpcServer({ Env: { DB: env.DB } });
}
