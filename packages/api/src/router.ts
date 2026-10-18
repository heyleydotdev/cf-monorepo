import { openapi } from "@orpc/openapi";
import { os } from "@orpc/server";

import { notes } from "./routes/notes";

/** Paths come from `openapi()` metadata; `prefix` applies to those too. */
export const router = os.meta(openapi({ prefix: "/api" })).router({
  health: os
    .meta(openapi({ method: "GET", path: "/health" }))
    .handler(() => ({ ok: true }) as const),
  time: os
    .meta(openapi({ method: "GET", path: "/time" }))
    .handler(() => ({ iso: new Date().toISOString() })),
  notes,
});

export type Router = typeof router;
