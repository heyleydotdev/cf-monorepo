import { createServerFn } from "@tanstack/react-start";

import type {
  NoteInput,
  NoteParamInput,
  NoteUpdateInput,
} from "@acme/core/schemas/notes";
import { safeCall } from "@acme/api/server";

import { rpcServer } from "~/rpc/server";

export const listNotesFn = createServerFn({ method: "GET" }).handler(() =>
  rpcServer.notes.list(),
);

export const getNoteFn = createServerFn({ method: "GET" })
  .validator((data: NoteParamInput) => data)
  .handler(({ data }) => rpcServer.notes.get(data));

export const createNoteFn = createServerFn({ method: "POST" })
  .validator((data: NoteInput) => data)
  .handler(({ data }) => safeCall(rpcServer.notes.create(data)));

export const updateNoteFn = createServerFn({ method: "POST" })
  .validator((data: NoteUpdateInput) => data)
  .handler(({ data }) => safeCall(rpcServer.notes.update(data)));

export const deleteNoteFn = createServerFn({ method: "POST" })
  .validator((data: NoteParamInput) => data)
  .handler(({ data }) => safeCall(rpcServer.notes.remove(data)));

// The loader's first value for the same procedure the browser then refetches
// through `rpcClient` in `routes/index.tsx`.
export const serverTimeFn = createServerFn({ method: "GET" }).handler(() =>
  rpcServer.time(),
);
