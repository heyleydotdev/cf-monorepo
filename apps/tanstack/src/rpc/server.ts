import "@tanstack/react-start/server-only";

import { env } from "cloudflare:workers";

import { createRpcServer } from "@acme/api/server";

/**
 * The procedures in-process, for loaders, server functions and the specs. Safe at
 * module scope: this app prerenders nothing at build time, so the `env` proxy
 * `apps/nextjs` works around never exists here.
 */
export const rpcServer = createRpcServer({ Env: { DB: env.DB } });
