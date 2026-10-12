import * as z from "zod";

export const Note = z.object({
  title: z.string().min(1, "title is required").max(200),
  body: z.string().max(10_000).default(""),
});

/**
 * A patch must not carry `Note`'s defaults. `.partial()` makes a field optional
 * but keeps its `.default("")`, so patching only `title` would validate `body`
 * to `""` and wipe what was stored. The fields are restated rather than reused:
 * `Note.shape.body.optional()` still runs the default before `.optional()` sees
 * it. Every field stays absent unless the client sent it, and drizzle then omits
 * the column from the UPDATE.
 */
export const NotePatch = z.object({
  title: Note.shape.title,
  body: z.string().max(10_000).optional(),
});

export const NoteParam = z.object({
  id: z.coerce.number().int().positive(),
});

/** A patch addressed by id, for callers that take both in one payload. */
export const NoteUpdate = NoteParam.extend(NotePatch.shape);

export type NoteInput = z.input<typeof Note>;
export type NoteOutput = z.output<typeof Note>;
export type NotePatchInput = z.input<typeof NotePatch>;
export type NotePatchOutput = z.output<typeof NotePatch>;
export type NoteParamInput = z.input<typeof NoteParam>;
export type NoteParamOutput = z.output<typeof NoteParam>;
export type NoteUpdateInput = z.input<typeof NoteUpdate>;
export type NoteUpdateOutput = z.output<typeof NoteUpdate>;
