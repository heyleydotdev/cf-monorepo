import { openapi } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { COMMON_ERROR_STATUS_MAP, os } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";

import { INPUT_VALIDATION_FAILED, NOTE_NOT_FOUND } from "./errors";
import { notes } from "./routes/notes";

/** Paths come from `openapi()` metadata; `prefix` applies to those too. */
export const router = os.meta(openapi({ prefix: "/api" })).router({
  health: os
    .meta(openapi({ method: "GET", path: "/health" }))
    .handler(() => ({ ok: true }) as const),
  notes,
});

export type Router = typeof router;

/**
 * Shared by both handlers so the two surfaces cannot disagree about a status.
 * Supplying `errorStatusMap` replaces the default rather than extending it, so the
 * spread is load-bearing, and a code the map does not know is a 500.
 */
const errorStatusMap = {
  ...COMMON_ERROR_STATUS_MAP,
  [INPUT_VALIDATION_FAILED.code]: 400,
  [NOTE_NOT_FOUND.code]: 404,
};

/** REST, at the prefix in the `openapi()` metadata above. */
export const handler = new OpenAPIHandler(router, { errorStatusMap });

/** oRPC's own RPC shape, for an oRPC client; the host passes its mount prefix. */
export const rpcHandler = new RPCHandler(router, { errorStatusMap });
