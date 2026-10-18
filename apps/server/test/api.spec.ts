import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = (path: string, init?: RequestInit) =>
  exports.default.fetch(`https://example.com/api${path}`, init);

const post = (path: string, body: unknown) =>
  api(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const postNote = async (body: unknown): Promise<{ id: number }> =>
  (await (await post("/notes", body)).json()) as { id: number };

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

describe("server worker", () => {
  it("serves the mounted api", async () => {
    const response = await exports.default.fetch(
      "https://example.com/api/health",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("serves server time with milliseconds", async () => {
    const response = await exports.default.fetch(
      "https://example.com/api/time",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      iso: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
  });

  it("404s outside the api mount", async () => {
    const response = await exports.default.fetch("https://example.com/");
    expect(response.status).toBe(404);
  });

  it("serves the api reference at /docs", async () => {
    const response = await exports.default.fetch("https://example.com/docs");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });

  it("serves the OpenAPI document at /docs/spec.json", async () => {
    const response = await exports.default.fetch(
      "https://example.com/docs/spec.json",
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      info: { title: "Cloudflare Monorepo API", version: "0.1.0" },
      paths: { "/api/health": expect.anything() },
    });
  });

  it("sees the generated Env", async () => {
    // The point is the D1 binding wrangler.jsonc declares. A bare
    // `expect(env).toBeTypeOf("object")` would pass even with no binding.
    const row = await env.DB.prepare("SELECT 1 AS n").first<{ n: number }>();
    expect(row?.n).toBe(1);
  });
});

describe("GET /api/notes", () => {
  it("starts empty", async () => {
    const res = await api("/notes");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns created notes newest first", async () => {
    await post("/notes", { title: "first" });
    await post("/notes", { title: "second", body: "hello" });

    const res = await api("/notes");
    expect(await res.json()).toMatchObject([
      { title: "second", body: "hello" },
      { title: "first", body: "" },
    ]);
  });
});

describe("POST /api/notes", () => {
  it("creates a note and defaults the body", async () => {
    const res = await post("/notes", { title: "first" });
    expect(res.status).toBe(201);
    // Ids keep climbing across tests: DELETE does not reset the counter.
    const created = (await res.json()) as { id: number };
    expect(created).toMatchObject({ title: "first", body: "" });
    expect(created.id).toBeTypeOf("number");
  });

  it("rejects a missing title", async () => {
    const res = await post("/notes", { body: "orphan" });
    expect(res.status).toBe(400);
  });

  it("rejects an empty title, naming the field", async () => {
    const res = await post("/notes", { title: "" });
    expect(res.status).toBe(400);
    // Shaped on the way out; see the `errorHandler` middleware in context.ts.
    // `{ message }` is what shadcn's `FieldError` renders, so the UI is its consumer.
    expect(await res.json()).toMatchObject({
      code: "INPUT_VALIDATION_FAILED",
      data: { fieldErrors: { title: [{ message: "Title is required" }] } },
    });
  });

  it("rejects a wrong-typed field", async () => {
    const res = await post("/notes", { title: "ok", body: 5 });
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
