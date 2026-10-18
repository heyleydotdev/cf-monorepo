import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import { rpcHandler } from "@acme/api/server";

/**
 * The router over oRPC's own RPC protocol, at POST /api/rpc/<procedure path>. The
 * browser calls it through `rpcClient` in src/rpc/client.ts; loaders and server
 * functions reach the same procedures in-process through `rpcServer`.
 */
export const Route = createFileRoute("/api/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { matched, response } = await rpcHandler.handle(request, {
          prefix: "/api/rpc",
          context: {
            Env: { DB: env.DB },
          },
        });

        if (matched) {
          return response;
        }

        return new Response("Not Found", { status: 404 });
      },
    },
  },
});
