import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("server worker", () => {
  it("serves the mounted api", async () => {
    const response = await exports.default.fetch(
      "https://example.com/api/health",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("404s outside the api mount", async () => {
    const response = await exports.default.fetch("https://example.com/");
    expect(response.status).toBe(404);
  });

  it("sees the generated Env", () => {
    expect(env).toBeTypeOf("object");
  });
});
