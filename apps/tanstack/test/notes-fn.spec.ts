import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

import type { NoteInput, NotePatchInput } from "@acme/core/notes.schema";

import {
  createNoteFn,
  deleteNoteFn,
  getNoteFn,
  listNotesFn,
  updateNoteFn,
} from "../src/lib/notes";
import { withStartContext } from "./start-context";

type Created = { id: number; title: string; body: string };

const call = {
  list: () => withStartContext(() => listNotesFn()),
  get: (id: number | string) =>
    withStartContext(() => getNoteFn({ data: { id } })),
  create: (data: NoteInput) => withStartContext(() => createNoteFn({ data })),
  update: (id: number, data: NotePatchInput) =>
    withStartContext(() => updateNoteFn({ data: { id, ...data } })),
  remove: (id: number | string) =>
    withStartContext(() => deleteNoteFn({ data: { id } })),
};

async function seed(data: NoteInput): Promise<Created> {
  return (await call.create(data)) as Created;
}

/**
 * An id that is provably not in the table: create a note, then delete it.
 *
 * Do not hardcode a sentinel like 999. `notes.id` is AUTOINCREMENT, so ids are
 * never reused and `DELETE` does not reset the counter; a fixed number is only
 * unknown until the file has created that many rows.
 */
async function freeId(): Promise<number> {
  const created = await seed({ title: "temp" });
  await call.remove(created.id);
  return created.id;
}

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM notes").run();
});

describe("listNotesFn", () => {
  it("returns an empty list", async () => {
    expect(await call.list()).toEqual([]);
  });

  it("returns created notes newest first", async () => {
    await seed({ title: "first" });
    await seed({ title: "second", body: "hello" });

    expect(await call.list()).toMatchObject([
      { title: "second", body: "hello" },
      { title: "first", body: "" },
    ]);
  });
});

describe("createNoteFn", () => {
  it("creates a note and defaults the body", async () => {
    expect(await seed({ title: "first" })).toMatchObject({
      title: "first",
      body: "",
    });
  });

  it("rejects a missing title", async () => {
    // Deliberately bypasses the input type: proving the schema rejects this at
    // runtime is the whole point of the case.
    await expect(
      call.create({ body: "orphan" } as NoteInput),
    ).rejects.toThrow();
  });

  it("rejects an empty title", async () => {
    await expect(call.create({ title: "" })).rejects.toThrow();
  });

  it("rejects a wrong-typed field", async () => {
    await expect(
      call.create({ title: "ok", body: 5 as unknown as string }),
    ).rejects.toThrow();
  });
});

describe("getNoteFn", () => {
  it("returns one note", async () => {
    const created = await seed({ title: "first" });
    expect(await call.get(created.id)).toMatchObject({ id: created.id });
  });

  it("returns null for an unknown id", async () => {
    expect(await call.get(await freeId())).toBeNull();
  });

  it("rejects a non-numeric id", async () => {
    await expect(call.get("abc")).rejects.toThrow();
  });

  it("rejects a zero or negative id", async () => {
    await expect(call.get(0)).rejects.toThrow();
    await expect(call.get(-1)).rejects.toThrow();
  });
});

describe("updateNoteFn", () => {
  it("updates one field and leaves the rest", async () => {
    const created = await seed({ title: "first", body: "keep" });
    expect(await call.update(created.id, { title: "second" })).toMatchObject({
      title: "second",
      body: "keep",
    });
  });

  it("rejects an empty patch", async () => {
    const created = await seed({ title: "first" });
    // Same as above: an empty patch is exactly what the schema must refuse.
    await expect(
      call.update(created.id, {} as NotePatchInput),
    ).rejects.toThrow();
  });

  it("still rejects an empty title", async () => {
    const created = await seed({ title: "first" });
    await expect(call.update(created.id, { title: "" })).rejects.toThrow();
  });
});

describe("deleteNoteFn", () => {
  it("removes the note", async () => {
    const created = await seed({ title: "first" });
    expect(await call.remove(created.id)).toBe(true);
    expect(await call.get(created.id)).toBeNull();
  });

  it("returns false for a second delete", async () => {
    const created = await seed({ title: "first" });
    await call.remove(created.id);
    expect(await call.remove(created.id)).toBe(false);
  });

  it("rejects a non-numeric id", async () => {
    await expect(call.remove("abc")).rejects.toThrow();
  });
});
