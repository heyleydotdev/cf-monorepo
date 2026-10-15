import { env, exports } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

import type { NoteInput } from "@acme/core/notes.schema";

type Created = { id: number; title: string; body: string };

/**
 * The /api/rpc surface over HTTP, rather than in-process like src/lib/notes.ts.
 * That is oRPC's own envelope: POST to the procedure path, `{ json: input }` in,
 * `{ json: output }` out.
 */
async function rpc(path: string, input?: unknown): Promise<Response> {
  return exports.default.fetch(`https://example.com/api/rpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
}

async function payload(res: Response): Promise<{ json: unknown }> {
  return (await res.json()) as { json: unknown };
}

async function seed(data: NoteInput): Promise<Created> {
  return (await payload(await rpc("notes/create", data))).json as Created;
}

// Provably absent: create a note, then delete it. Never hardcode a sentinel —
// `notes.id` is AUTOINCREMENT, so ids are never reused.
async function freeId(): Promise<number> {
  const created = await seed({ title: "temp" });
  await rpc("notes/remove", { id: created.id });
  return created.id;
}

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM notes").run();
});

describe("POST /api/rpc", () => {
  it("runs a procedure and returns its output", async () => {
    expect(await payload(await rpc("notes/list"))).toEqual({ json: [] });
  });

  it("carries an input and returns the created note", async () => {
    const res = await rpc("notes/create", { title: "first" });

    expect(res.status).toBe(200);
    expect(await payload(res)).toMatchObject({
      json: { title: "first", body: "" },
    });
    expect(await payload(await rpc("notes/list"))).toMatchObject({
      json: [{ title: "first" }],
    });
  });

  it("shapes a rejected input as the REST surface does", async () => {
    const res = await rpc("notes/create", { title: "" });

    expect(res.status).toBe(400);
    expect(await payload(res)).toMatchObject({
      json: {
        code: "INPUT_VALIDATION_FAILED",
        data: { fieldErrors: { title: ["title is required"] } },
      },
    });
  });

  it("404s a missing note, from the same status map", async () => {
    const res = await rpc("notes/get", { id: await freeId() });

    expect(res.status).toBe(404);
    expect(await payload(res)).toMatchObject({
      json: { code: "NOTE_NOT_FOUND" },
    });
  });

  it("404s a procedure that does not exist", async () => {
    const res = await rpc("notes/nope");

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not Found");
  });

  it("404s a method the protocol does not use", async () => {
    const res = await exports.default.fetch(
      "https://example.com/api/rpc/notes/list",
    );

    expect(res.status).toBe(404);
  });
});
