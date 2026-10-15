import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = (path: string, init?: RequestInit) =>
  exports.default.fetch(`https://example.com/api${path}`, init);

const post = (body: unknown) =>
  api("/notes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const postNote = async (body: unknown): Promise<{ id: number }> =>
  (await (await post(body)).json()) as { id: number };

// Provably absent: create a note, then delete it. Never hardcode a sentinel —
// `notes.id` is AUTOINCREMENT, so ids are never reused.
const freeId = async () => {
  const created = await postNote({ title: "temp" });
  await api(`/notes/${created.id}`, { method: "DELETE" });
  return created.id;
};

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM notes").run();
});

describe("GET /api/notes", () => {
  it("starts empty", async () => {
    const res = await api("/notes");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns created notes newest first", async () => {
    await post({ title: "first" });
    await post({ title: "second", body: "hello" });

    const res = await api("/notes");
    expect(await res.json()).toMatchObject([
      { title: "second", body: "hello" },
      { title: "first", body: "" },
    ]);
  });
});

describe("POST /api/notes", () => {
  it("creates a note and defaults the body", async () => {
    const res = await post({ title: "first" });
    expect(res.status).toBe(201);
    // Ids keep climbing across tests: DELETE does not reset the counter.
    const created = (await res.json()) as { id: number };
    expect(created).toMatchObject({ title: "first", body: "" });
    expect(created.id).toBeTypeOf("number");
  });

  it("rejects a missing title", async () => {
    const res = await post({ body: "orphan" });
    expect(res.status).toBe(400);
  });

  it("rejects an empty title, naming the field", async () => {
    const res = await post({ title: "" });
    expect(res.status).toBe(400);
    // Shaped on the way out; see `shapeInputErrors` in packages/api/src/context.ts.
    expect(await res.json()).toMatchObject({
      code: "INPUT_VALIDATION_FAILED",
      data: { fieldErrors: { title: ["title is required"] } },
    });
  });

  it("rejects a wrong-typed field", async () => {
    const res = await post({ title: "ok", body: 5 });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/notes/:id", () => {
  it("returns one note", async () => {
    const created = await postNote({ title: "first" });
    const res = await api(`/notes/${created.id}`);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: created.id, title: "first" });
  });

  it("404s an unknown id", async () => {
    expect((await api(`/notes/${await freeId()}`)).status).toBe(404);
  });

  it("400s a non-numeric id", async () => {
    expect((await api("/notes/abc")).status).toBe(400);
  });

  it("400s a zero or negative id", async () => {
    expect((await api("/notes/0")).status).toBe(400);
    expect((await api("/notes/-1")).status).toBe(400);
  });
});

describe("PATCH /api/notes/:id", () => {
  const patch = (id: number, body: unknown) =>
    api(`/notes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

  it("updates one field and leaves the rest", async () => {
    const created = await postNote({ title: "first", body: "keep" });
    const res = await patch(created.id, { title: "second" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      title: "second",
      body: "keep",
    });
  });

  it("rejects an empty patch", async () => {
    const created = await postNote({ title: "first" });
    expect((await patch(created.id, {})).status).toBe(400);
  });

  it("404s a patch to a missing note", async () => {
    expect((await patch(await freeId(), { title: "x" })).status).toBe(404);
  });

  it("still rejects an empty title", async () => {
    const created = await postNote({ title: "first" });
    expect((await patch(created.id, { title: "" })).status).toBe(400);
  });

  it("400s a non-numeric id", async () => {
    expect((await patch(0, { title: "x" })).status).toBe(400);
  });
});

describe("DELETE /api/notes/:id", () => {
  it("removes the note", async () => {
    const created = await postNote({ title: "first" });
    expect(
      (await api(`/notes/${created.id}`, { method: "DELETE" })).status,
    ).toBe(200);
    expect((await api(`/notes/${created.id}`)).status).toBe(404);
  });

  it("404s a second delete", async () => {
    const created = await postNote({ title: "first" });
    await api(`/notes/${created.id}`, { method: "DELETE" });
    expect(
      (await api(`/notes/${created.id}`, { method: "DELETE" })).status,
    ).toBe(404);
  });
});

describe("unexpected errors", () => {
  it("500s without naming the failure", async () => {
    // Quiet the expected crash; the tanstack spec is where the log is asserted.
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    // A real D1 failure rather than a stub, on the surface that is actually public.
    await env.DB.prepare("ALTER TABLE notes RENAME TO notes_hidden").run();

    try {
      const res = await api("/notes");
      const body = (await res.json()) as {
        defined: boolean;
        code: string;
        message: string;
      };

      expect(res.status).toBe(500);
      // No table name, no driver wording, nothing else alongside it.
      expect(body).toEqual({
        defined: false,
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      });
    } finally {
      await env.DB.prepare("ALTER TABLE notes_hidden RENAME TO notes").run();
      logged.mockRestore();
    }
  });
});
