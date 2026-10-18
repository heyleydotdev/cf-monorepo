import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { NoteInput, NotePatchInput } from "@acme/core/notes.schema";
import { INPUT_VALIDATION_FAILED, NOTE_NOT_FOUND } from "@acme/api/server";

import {
  createNoteFn,
  deleteNoteFn,
  getNoteFn,
  listNotesFn,
  updateNoteFn,
} from "../src/lib/notes";
import { serverTimeFn } from "../src/lib/time";
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

/**
 * Assertions use the API's factories, whose `instanceof` compares codes, not classes.
 * `createNoteFn`, `updateNoteFn` and `deleteNoteFn` are wrapped in `safeCall`, so
 * their failures arrive as a value.
 */

async function seed(data: NoteInput): Promise<Created> {
  const res = await call.create(data);

  if (res.status !== "ok") {
    throw new Error(`seed failed: ${res.status}`);
  }

  return res.data;
}

// Provably absent: create a note, then delete it. Never hardcode a sentinel —
// `notes.id` is AUTOINCREMENT, so ids are never reused.
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
    // Bypasses the input type on purpose: proving the schema rejects this is the case.
    const res = await call.create({ body: "orphan" } as NoteInput);
    expect(res.status).toBe("invalid");
  });

  it("rejects an empty title, naming the field", async () => {
    // `issues` is the API's own payload, so the field is addressable, not just prose.
    expect(await call.create({ title: "" })).toMatchObject({
      status: "invalid",
      issues: { fieldErrors: { title: [{ message: "Title is required" }] } },
    });
  });

  it("rejects a wrong-typed field", async () => {
    const res = await call.create({
      title: "ok",
      body: 5 as unknown as string,
    });
    expect(res.status).toBe("invalid");
  });
});

describe("getNoteFn", () => {
  it("returns one note", async () => {
    const created = await seed({ title: "first" });
    expect(await call.get(created.id)).toMatchObject({ id: created.id });
  });

  it("throws NOTE_NOT_FOUND for an unknown id", async () => {
    // A typed error rather than null, so "missing" is distinguishable from empty.
    await expect(call.get(await freeId())).rejects.toBeInstanceOf(
      NOTE_NOT_FOUND,
    );
  });

  it("rejects a non-numeric id", async () => {
    await expect(call.get("abc")).rejects.toBeInstanceOf(
      INPUT_VALIDATION_FAILED,
    );
  });

  it("rejects a zero or negative id", async () => {
    await expect(call.get(0)).rejects.toBeInstanceOf(INPUT_VALIDATION_FAILED);
    await expect(call.get(-1)).rejects.toBeInstanceOf(INPUT_VALIDATION_FAILED);
  });
});

describe("updateNoteFn", () => {
  it("updates one field and leaves the rest", async () => {
    const created = await seed({ title: "first", body: "keep" });

    expect(await call.update(created.id, { title: "second" })).toMatchObject({
      status: "ok",
      data: { id: created.id, title: "second", body: "keep" },
    });
  });

  it("returns an empty patch as a validation failure", async () => {
    const created = await seed({ title: "first" });

    // An empty patch is exactly what the schema must refuse.
    expect(await call.update(created.id, {} as NotePatchInput)).toMatchObject({
      status: "invalid",
      issues: { fieldErrors: { title: [{ message: "Title is required" }] } },
    });
  });

  it("returns an empty title as a validation failure", async () => {
    const created = await seed({ title: "first" });

    expect(await call.update(created.id, { title: "" })).toMatchObject({
      status: "invalid",
      issues: { fieldErrors: { title: [{ message: "Title is required" }] } },
    });
  });

  it("returns NOTE_NOT_FOUND for an unknown id", async () => {
    expect(
      await call.update(await freeId(), { title: "second" }),
    ).toMatchObject({ status: "error", code: "NOTE_NOT_FOUND" });
  });
});

describe("deleteNoteFn", () => {
  it("removes the note", async () => {
    const created = await seed({ title: "first" });
    expect(await call.remove(created.id)).toEqual({
      status: "ok",
      data: { ok: true },
    });
    await expect(call.get(created.id)).rejects.toBeInstanceOf(NOTE_NOT_FOUND);
  });

  it("returns NOTE_NOT_FOUND for a second delete", async () => {
    const created = await seed({ title: "first" });
    await call.remove(created.id);

    // Success is a status, not `false`: a boolean makes "already gone" a success.
    expect(await call.remove(created.id)).toMatchObject({
      status: "error",
      code: "NOTE_NOT_FOUND",
    });
  });

  it("returns a validation failure for a non-numeric id", async () => {
    expect(await call.remove("abc")).toMatchObject({
      status: "invalid",
      issues: {
        fieldErrors: {
          id: [{ message: "Note id must be a positive integer" }],
        },
      },
    });
  });
});

describe("serverTimeFn", () => {
  it("returns the server's current time", async () => {
    const { iso } = await withStartContext(() => serverTimeFn());

    expect(Math.abs(Date.now() - Date.parse(iso))).toBeLessThan(60_000);
  });
});

describe("unexpected errors", () => {
  it("hides the failure's message from the caller, and logs it", async () => {
    // Quiets the expected crash, and stands as proof that it was reported.
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    // A real D1 failure rather than a stub, so the error is whatever drizzle and
    // the binding actually produce.
    await env.DB.prepare("ALTER TABLE notes RENAME TO notes_hidden").run();

    try {
      const message = await call.list().then(
        () => "resolved",
        (err: unknown) => (err as Error).message,
      );

      // Not the table name, not the driver's wording: anything that is not an
      // ORPCError becomes a fixed 500 in `errorHandler`, and the message is all
      // that survives the server-fn boundary.
      expect(message).toBe("Something went wrong");
      expect(logged).toHaveBeenCalledWith({
        path: "notes.list",
        err: expect.any(Error),
      });
    } finally {
      await env.DB.prepare("ALTER TABLE notes_hidden RENAME TO notes").run();
      logged.mockRestore();
    }
  });

  it("returns a crash as a value when the call is wrapped", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    await env.DB.prepare("ALTER TABLE notes RENAME TO notes_hidden").run();

    try {
      // The point of `safeCall`: a thrown error reaches the browser with its `code`
      // and `data` stripped, so a wrapped call hands them back as data instead.
      expect(await call.create({ title: "first" })).toEqual({
        status: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    } finally {
      await env.DB.prepare("ALTER TABLE notes_hidden RENAME TO notes").run();
      logged.mockRestore();
    }
  });
});
