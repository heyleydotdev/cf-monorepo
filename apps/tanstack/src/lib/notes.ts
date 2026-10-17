import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import type {
  NoteInput,
  NoteParamInput,
  NoteUpdateInput,
} from "@acme/core/notes.schema";
import { createApiClient, safeCall } from "@acme/api/server";

/**
 * The notes api as server functions. The validators are pass-throughs — Start has
 * none that only types `data` — so validation stays in the procedure; they take
 * the schema's *input* side, where `id` is still a string.
 *
 * Only calls a UI acts on inline return a `SafeCallResponse`. Reads stay throwing,
 * so a loader failure lands in the router's error component instead of coming back
 * as a value nothing checks.
 */

// Read inside the handlers, never at module scope: `cloudflare:workers` does not
// resolve in the client half of the bundle.
const api = () => createApiClient({ Env: { DB: env.DB } });

export const listNotesFn = createServerFn({ method: "GET" }).handler(() =>
  api().notes.list(),
);

export const getNoteFn = createServerFn({ method: "GET" })
  .validator((data: NoteParamInput) => data)
  .handler(({ data }) => api().notes.get(data));

export const createNoteFn = createServerFn({ method: "POST" })
  .validator((data: NoteInput) => data)
  .handler(({ data }) => safeCall(api().notes.create(data)));

export const updateNoteFn = createServerFn({ method: "POST" })
  .validator((data: NoteUpdateInput) => data)
  .handler(({ data }) => api().notes.update(data));

export const deleteNoteFn = createServerFn({ method: "POST" })
  .validator((data: NoteParamInput) => data)
  .handler(({ data }) => safeCall(api().notes.remove(data)));
