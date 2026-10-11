import { Hono } from "hono";

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

/**
 * Mounted through `route()` in app.ts, which merges these paths into the `api`
 * const at the type level.
 *
 * One gap in that inference, at hono 4.13: on a route with a path param, the
 * RPC client types the input as `{ param }` only and drops `json`. It is the
 * param, not the method, so `POST /notes/:id` would lose it too. A param-less
 * `POST /notes` infers its body correctly. Callers pass a raw `fetch` for the
 * by-id writes until that is fixed upstream.
 */
export const notesRoutes = new Hono<{ Bindings: APIBindings }>()
  .get("/notes", dbMiddleware, async (c) => {
    return c.json(await listNotes(c.get("db")));
  })
  .get(
    "/notes/:id",
    dbMiddleware,
    zValidator("param", NoteParam),
    async (c) => {
      const { id } = c.req.valid("param");
      const note = await getNote(c.get("db"), id);
      return note ? c.json(note) : c.json({ error: "Note not found" }, 404);
    },
  )
  .post("/notes", dbMiddleware, zValidator("json", Note), async (c) => {
    const { title, body } = c.req.valid("json");
    return c.json(await createNote(c.get("db"), { title, body }), 201);
  })
  .patch(
    "/notes/:id",
    dbMiddleware,
    zValidator("param", NoteParam),
    zValidator("json", NotePatch),
    async (c) => {
      const { id } = c.req.valid("param");
      const note = await updateNote(c.get("db"), id, c.req.valid("json"));
      return note ? c.json(note) : c.json({ error: "Note not found" }, 404);
    },
  )
  .delete(
    "/notes/:id",
    dbMiddleware,
    zValidator("param", NoteParam),
    async (c) => {
      const { id } = c.req.valid("param");
      const deleted = await deleteNote(c.get("db"), id);
      return deleted
        ? c.json({ ok: true })
        : c.json({ error: "Note not found" }, 404);
    },
  );
