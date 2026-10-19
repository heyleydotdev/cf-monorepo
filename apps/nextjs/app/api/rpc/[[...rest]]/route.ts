import { env } from "cloudflare:workers";

import { rpcHandler } from "@acme/api/server";

/**
 * The router over oRPC's RPC protocol, at `/api/rpc/<procedure path>`. The
 * browser calls it through `rpcClient`; the server actions reach the same
 * procedures in-process through `getRpcServer()`.
 */
async function handleRequest(request: Request) {
  const { matched, response } = await rpcHandler.handle(request, {
    prefix: "/api/rpc",
    context: { Env: { DB: env.DB } },
  });

  if (!matched) {
    return new Response("Not Found", { status: 404 });
  }

  return response;
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
