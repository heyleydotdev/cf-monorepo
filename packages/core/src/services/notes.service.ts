import type { Database } from "@acme/db/client";
import type { InsertNote, SelectNote } from "@acme/db/schema";
import { notes } from "@acme/db/schema";
import { eq } from "@acme/db/sql";

export async function listNotes(db: Database): Promise<SelectNote[]> {
  return db.select().from(notes).all();
}

export async function getNote(
  db: Database,
  id: number,
): Promise<SelectNote | null> {
  const note = await db.select().from(notes).where(eq(notes.id, id)).get();
  return note ?? null;
}

export async function createNote(
  db: Database,
  input: Pick<InsertNote, "title" | "body">,
): Promise<SelectNote> {
  return db.insert(notes).values(input).returning().get();
}

export async function updateNote(
  db: Database,
  id: number,
  input: Partial<Pick<InsertNote, "title" | "body">>,
): Promise<SelectNote | null> {
  // `.all()` rather than `.get()`: drizzle types an update's `.get()` as
  // non-nullable, though it returns undefined when the where matched nothing.
  const [note] = await db
    .update(notes)
    .set(input)
    .where(eq(notes.id, id))
    .returning()
    .all();
  return note ?? null;
}

export async function deleteNote(db: Database, id: number): Promise<boolean> {
  const deleted = await db
    .delete(notes)
    .where(eq(notes.id, id))
    .returning({ id: notes.id })
    .get();
  return deleted !== undefined;
}
