import { ORPCError, os, ValidationError } from "@orpc/server";
import { z } from "zod";

import { createDb } from "@acme/db/client";

import { INPUT_VALIDATION_FAILED } from "./errors";

export type OSContext = {
  Env: {
    DB: D1Database;
  };
};

const base = os.$context<OSContext>();

/**
 * The caller supplies its bindings — a shared package cannot name one `Env` — and
 * this turns them into the drizzle client the procedures read, so no caller has to
 * build one.
 */
const extendContext = base.middleware(async ({ context, next }) =>
  next({ context: { db: createDb(context.Env.DB) } }),
);

/**
 * oRPC raises `BAD_REQUEST` for a rejected input with a useless summary — "Input
 * validation failed" — and the schema's own message buried in `data`. Re-raising
 * it as `INPUT_VALIDATION_FAILED` renders that message and flattens the fields,
 * per oRPC's validation-customization recipe. It has to be middleware rather than
 * a handler interceptor, because `createRouterClient` never reaches one.
 */
const errorHandler = base.middleware(async ({ next, path }) => {
  try {
    return await next();
  } catch (err) {
    if (
      err instanceof ORPCError &&
      err.code === "BAD_REQUEST" &&
      err.cause instanceof ValidationError
    ) {
      const issues = new z.ZodError(err.cause.issues as z.core.$ZodIssue[]);

      throw new INPUT_VALIDATION_FAILED({
        message: z.prettifyError(issues),
        data: z.flattenError(issues),
        cause: issues,
      });
    }

    // A procedure's own error is deliberate, and passes through as written.
    if (err instanceof ORPCError) {
      throw err;
    }

    // A crash is not the caller's business, but it is ours: log it while the stack
    // is intact, then answer without naming anything.
    console.error({ path: path.join("."), err });

    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Something went wrong",
      cause: err,
    });
  }
});

/**
 * Shaping runs first so it is outermost: oRPC validates `.input()` schemas
 * immediately before the handler, so a rejected input unwinds through it.
 */
export const procedure = base.use(errorHandler).use(extendContext);
