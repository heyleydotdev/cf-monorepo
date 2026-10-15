import { createRouterClient } from "@orpc/server";

import type { OSContext } from "./context";
import { router } from "./router";

/**
 * Calls the procedures in-process: no Request, no isolate hop. There is no HTTP
 * client; that would need a contract rather than the router.
 *
 * Server-only, and named for that: the browser cannot reach it, and the `client`
 * subpath is left free for the RPC caller a front end would use.
 */
export function createApiClient(context: OSContext) {
  return createRouterClient(router, { context });
}
