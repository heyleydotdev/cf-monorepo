import * as z from "zod";

export const Note = z.object({
  title: z
    .string({
      error: (issue) =>
        issue.input === undefined ? "Title is required" : "Title must be text",
    })
    .min(1, "Title is required")
    .max(200, "Title can be at most 200 characters"),
  body: z
    .string({ error: "Body must be text" })
    .max(10_000, "Body can be at most 10,000 characters")
    .default(""),
});

export const NotePatch = z.object({
  title: Note.shape.title,
  body: z
    .string({ error: "Body must be text" })
    .max(10_000, "Body can be at most 10,000 characters")
    .optional(),
});

export const NoteParam = z.object({
  id: z.coerce
    .number({ error: "Note id must be a positive integer" })
    .int()
    .positive(),
});

export const NoteUpdate = NoteParam.extend(NotePatch.shape);

export type NoteInput = z.input<typeof Note>;
export type NoteOutput = z.output<typeof Note>;
export type NotePatchInput = z.input<typeof NotePatch>;
export type NotePatchOutput = z.output<typeof NotePatch>;
export type NoteParamInput = z.input<typeof NoteParam>;
export type NoteParamOutput = z.output<typeof NoteParam>;
export type NoteUpdateInput = z.input<typeof NoteUpdate>;
export type NoteUpdateOutput = z.output<typeof NoteUpdate>;
