import type { ValidationTargets } from "hono";
import type { z } from "zod";
import { zValidator as zv } from "@hono/zod-validator";
import { createMiddleware } from "hono/factory";

import type { Database } from "@acme/db/client";
import { AppError } from "@acme/core/errors";
import { createDb } from "@acme/db/client";

import type { APIBindings } from "./env";

/**
 * `zValidator` with one error shape for the whole api, so a rejected body or
 * param returns 400 instead of hono's default. Returning without a status is a
 * 200, which would tell the client the write succeeded.
 */
export const zValidator = <
  T extends z.ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zv(target, schema, (result) => {
    if (!result.success) {
      throw new AppError("VALIDATION", "Invalid input", {
        issues: result.error.issues,
      });
    }
  });

/**
 * Builds the drizzle client once per request and hands it to the handler, so
 * routes read `c.get("db")` instead of constructing one from the binding.
 * `drizzle()` itself is cheap and lazy, so this saves nothing at runtime; the
 * point is that handlers stop repeating the setup.
 */
export const dbMiddleware = createMiddleware<{
  Bindings: APIBindings;
  Variables: { db: Database };
}>(async (c, next) => {
  c.set("db", createDb(c.env.DB));
  await next();
});
