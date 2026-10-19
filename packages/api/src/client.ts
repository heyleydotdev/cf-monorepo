import type { RPCLinkOptions } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { Router } from "./router";

/**
 * The browser's rpc: the procedures, typed by the router, plus the TanStack Query
 * utils built on them. The url is relative, which is safe because a query only
 * fetches on subscribe — and server rendering never subscribes.
 */
export function createRpcClient(options: RPCLinkOptions<object>) {
  return createTanstackQueryUtils(
    createORPCClient<RouterClient<Router>>(new RPCLink(options)),
  );
}
