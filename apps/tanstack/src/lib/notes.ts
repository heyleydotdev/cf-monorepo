import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "@acme/core/notes";
import { Note, NoteParam, NoteUpdate } from "@acme/core/notes.schema";
import { createDb } from "@acme/db/client";

/**
 * The notes api, as server functions. A loader calls these directly in the
 * Worker, so a request never leaves the isolate to reach its own origin.
 *
 * The external HTTP surface is still `createApi` from @acme/api, mounted by
 * apps/server. These are the internal path, and they reach the same
 * @acme/core service, so the two cannot disagree about behaviour.
 *
 * Validation runs here rather than in the service: the api package still
 * validates at its edge with zValidator, and a server function is that edge for
 * this app.
 */
const db = () => createDb(env.DB);

export const listNotesFn = createServerFn({ method: "GET" }).handler(() =>
  listNotes(db()),
);

export const getNoteFn = createServerFn({ method: "GET" })
  .validator(NoteParam)
  .handler(({ data }) => getNote(db(), data.id));

export const createNoteFn = createServerFn({ method: "POST" })
  .validator(Note)
  .handler(({ data }) => createNote(db(), data));

export const updateNoteFn = createServerFn({ method: "POST" })
  .validator(NoteUpdate)
  .handler(({ data: { id, ...patch } }) => updateNote(db(), id, patch));

export const deleteNoteFn = createServerFn({ method: "POST" })
  .validator(NoteParam)
  .handler(({ data }) => deleteNote(db(), data.id));
