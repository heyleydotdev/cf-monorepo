import { createRouterClient, ORPCError } from "@orpc/server";

import type { OSContext } from "./context";
import type { InputValidationDataOutput } from "./errors";
import { INPUT_VALIDATION_FAILED } from "./errors";
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
