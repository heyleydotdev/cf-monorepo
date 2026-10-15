import { createFileRoute } from "@tanstack/react-router";
import { env } from "cloudflare:workers";

import { rpcHandler } from "@acme/api";

/**
 * The router over oRPC's own RPC protocol, at POST /api/rpc/<procedure path>. This
 * app reaches the same procedures through the server functions in src/lib/notes.ts,
 * so the endpoint exists for callers that are not this app; any oRPC client pointed
 * at it is typed by `Router` from @acme/api.
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
