import { env } from "cloudflare:workers";
import { beforeEach, describe, expect, it } from "vitest";

import type { NoteInput } from "@acme/core/schemas/notes";
import { createRpcClient } from "@acme/api/client";

import { GET, POST } from "../app/api/rpc/[[...rest]]/route";

const origin = "https://example.com";

/** The route's handler, without starting vinext's Worker for the test. */
const send = (method: typeof POST, path: string, init?: RequestInit) =>
  method(new Request(new URL(path, origin), init));

/**
 * The same client the page uses, with its relative url resolved against the test
 * origin — so this fails if the url base and the handler's prefix ever disagree.
 */
const rpc = createRpcClient({
  url: "/api/rpc",
  fetch: (url, init) => send(POST, String(url), init),
});

/** Raw fetches, for what a typed client cannot express: paths it does not have. */
const route = (path: string, init?: RequestInit) =>
  send(POST, `/api/rpc/${path}`, init);

const seed = (data: NoteInput) => rpc.notes.create.call(data);

// Provably absent: create a note, then delete it. Never hardcode a sentinel —
// `notes.id` is AUTOINCREMENT, so ids are never reused.
async function freeId(): Promise<number> {
  const created = await seed({ title: "temp" });
  await rpc.notes.remove.call({ id: created.id });
  return created.id;
}

beforeEach(async () => {
  await env.DB.prepare("DELETE FROM notes").run();
});

describe("notes over /api/rpc", () => {
  it("lists notes", async () => {
    expect(await rpc.notes.list.call()).toEqual([]);
  });

  it("carries an input and returns the created note", async () => {
    await expect(seed({ title: "first" })).resolves.toMatchObject({
      title: "first",
      body: "",
    });

    expect(await rpc.notes.list.call()).toMatchObject([{ title: "first" }]);
  });

  it("rejects an empty title, naming the field", async () => {
    await expect(rpc.notes.create.call({ title: "" })).rejects.toMatchObject({
      code: "INPUT_VALIDATION_FAILED",
      data: { fieldErrors: { title: [{ message: "Title is required" }] } },
    });
  });

  it("carries NOTE_NOT_FOUND for a missing note", async () => {
    await expect(
      rpc.notes.get.call({ id: await freeId() }),
    ).rejects.toMatchObject({ code: "NOTE_NOT_FOUND" });
  });
});

describe("time over /api/rpc", () => {
  it("returns the server time with milliseconds", async () => {
    const { iso } = await rpc.time.call();

    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Date.now() - Date.parse(iso)).toBeLessThan(60_000);
  });
});

describe("the /api/rpc route", () => {
  it("404s a procedure that does not exist", async () => {
    const res = await route("notes/nope", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ json: {} }),
    });

    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not Found");
  });

  it("404s a method the protocol does not use", async () => {
    expect((await send(GET, "/api/rpc/notes/list")).status).toBe(404);
  });
});
