import { openapi } from "@orpc/openapi";

import { Note, NoteParam, NoteUpdate } from "@acme/core/schemas/notes";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "@acme/core/services/notes";

import { procedure } from "../context";
import { NOTE_NOT_FOUND } from "../errors";

const wErrors = procedure.errors({ [NOTE_NOT_FOUND.code]: NOTE_NOT_FOUND });

/**
 * Paths come from `openapi()` metadata, not the router shape; a `{id}` path needs
 * `id` in the input schema to bind.
 */
export const notes = {
  list: procedure
    .meta(openapi({ method: "GET", path: "/notes" }))
    .handler(({ context }) => listNotes(context.db)),

  get: wErrors
    .meta(openapi({ method: "GET", path: "/notes/{id}" }))
    .input(NoteParam)
    .handler(async ({ context, errors, input }) => {
      const note = await getNote(context.db, input.id);

      if (!note) {
        throw errors.NOTE_NOT_FOUND();
      }

      return note;
    }),

  create: procedure
    .meta(openapi({ method: "POST", path: "/notes", successStatus: 201 }))
    .input(Note)
    .handler(({ context, input }) => createNote(context.db, input)),

  update: wErrors
    .meta(openapi({ method: "PATCH", path: "/notes/{id}" }))
    .input(NoteUpdate)
    .handler(async ({ context, errors, input }) => {
      const { id, ...patch } = input;
      const note = await updateNote(context.db, id, patch);

      if (!note) {
        throw errors.NOTE_NOT_FOUND();
      }

      return note;
    }),

  remove: wErrors
    .meta(openapi({ method: "DELETE", path: "/notes/{id}" }))
    .input(NoteParam)
    .handler(async ({ context, errors, input }) => {
      const deleted = await deleteNote(context.db, input.id);

      if (!deleted) {
        throw errors.NOTE_NOT_FOUND();
      }

      return { ok: true };
    }),
};
