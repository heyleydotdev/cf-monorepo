import { createRpcClient } from "@acme/api/client";

/**
 * Safe to load while rendering on the server: building the link and the utils has
 * no side effects, and only a query's fetch is browser-only.
 */
export const rpcClient = createRpcClient({ url: "/api/rpc" });
