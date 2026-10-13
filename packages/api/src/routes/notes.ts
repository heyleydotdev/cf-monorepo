import { Hono } from "hono";

import { AppError } from "@acme/core/errors";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "@acme/core/notes";
import { Note, NoteParam, NotePatch } from "@acme/core/notes.schema";

import type { APIBindings } from "../env";
import { dbMiddleware, zValidator } from "../middlewares";

export const notesRoutes = new Hono<{ Bindings: APIBindings }>()
  .get("/notes", dbMiddleware, async (c) => {
    const notes = await listNotes(c.get("db"));

    return c.json(notes);
  })
  .get(
    "/notes/:id",
    dbMiddleware,
    zValidator("param", NoteParam),
    async (c) => {
      const { id } = c.req.valid("param");
      const note = await getNote(c.get("db"), id);

      if (!note) {
        throw new AppError("NOT_FOUND", "Note not found");
      }

      return c.json(note);
    },
  )
  .post("/notes", dbMiddleware, zValidator("json", Note), async (c) => {
    const { title, body } = c.req.valid("json");
    const note = await createNote(c.get("db"), { title, body });

    return c.json(note, 201);
  })
  .patch(
    "/notes/:id",
    dbMiddleware,
    zValidator("param", NoteParam),
    zValidator("json", NotePatch),
    async (c) => {
      const { id } = c.req.valid("param");
      const note = await updateNote(c.get("db"), id, c.req.valid("json"));

      if (!note) {
        throw new AppError("NOT_FOUND", "Note not found");
      }

      return c.json(note);
    },
  )
  .delete(
    "/notes/:id",
    dbMiddleware,
    zValidator("param", NoteParam),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteNote(c.get("db"), id);

      if (!deleted) {
        throw new AppError("NOT_FOUND", "Note not found");
      }

      return c.json({ ok: true });
    },
  );
