import { OpenAPIGenerator } from "@orpc/openapi";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferenceHandlerPlugin } from "@orpc/openapi/plugins";
import {
  COMMON_ERROR_STATUS_MAP,
  createRouterClient,
  ORPCError,
} from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

import type { RpcServerContext } from "./context";
import type { InputValidationDataOutput } from "./errors";
import { INPUT_VALIDATION_FAILED, NOTE_NOT_FOUND } from "./errors";
import { router } from "./router";

// Re-exports: the router, its context type, and the errors.
export { router, type Router } from "./router";
export type { RpcServerContext } from "./context";
export {
  INPUT_VALIDATION_FAILED,
  NOTE_NOT_FOUND,
  type InputValidationDataOutput,
} from "./errors";

// Fetch handlers, sharing one status map.
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

// One document, generated from the router both handlers serve.
const generator = new OpenAPIGenerator({
  converters: [new ZodToJsonSchemaConverter()],
});

/**
 * REST, on the paths the router's `openapi()` metadata declares (`/api/...`), plus
 * the Scalar reference UI and the spec it loads.
 *
 * `docsPath` and `specPath` stay absolute: the plugin resolves them against the
 * handle-time `prefix`, which this app does not pass, so the router's
 * `openapi({ prefix: "/api" })` never reaches them.
 */
export const restHandler = new OpenAPIHandler(router, {
  plugins: [
    new OpenAPIReferenceHandlerPlugin({
      provider: "scalar",
      docsPath: "/docs",
      specPath: "/docs/spec.json",
      spec: () =>
        generator.generate(router, {
          base: {
            info: { title: "Cloudflare Monorepo API", version: "0.1.0" },
          },
        }),
    }),
  ],
  errorStatusMap,
});

/** oRPC's own RPC shape, for an oRPC client; the host passes its mount prefix. */
export const rpcHandler = new RPCHandler(router, { errorStatusMap });

// In-process client.
/**
 * Calls the procedures in-process: no Request, no isolate hop. The host supplies
 * its bindings, because a shared package cannot name one `Env`.
 */
export function createRpcServer(context: RpcServerContext) {
  return createRouterClient(router, { context });
}

// Server-function envelope.
export type SafeCallResponse<T> =
  | { status: "ok"; data: T }
  | { status: "invalid"; message: string; issues: InputValidationDataOutput }
  | { status: "error"; code: string; message: string };

/**
 * Turns a rejection into a value a server function can return. A thrown error does
 * not survive the server-fn boundary — seroval rebuilds anything `instanceof Error`
 * as a bare `Error`, dropping `code` and `data` — so failures have to ride back as
 * data.
 */
export async function safeCall<T>(
  fn: Promise<T>,
): Promise<SafeCallResponse<T>> {
  try {
    return { status: "ok", data: await fn };
  } catch (err) {
    if (err instanceof INPUT_VALIDATION_FAILED) {
      return { status: "invalid", message: err.message, issues: err.data };
    }

    return {
      status: "error",
      code: err instanceof ORPCError ? err.code : "INTERNAL_SERVER_ERROR",
      message: err instanceof ORPCError ? err.message : "Something went wrong",
    };
  }
}
