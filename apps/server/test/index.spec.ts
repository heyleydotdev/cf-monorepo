import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("server worker", () => {
  it("responds", async () => {
    const response = await exports.default.fetch("https://example.com");
    expect(response.status).toBe(200);
    expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
  });

  it("sees the generated Env", () => {
    expect(env).toBeTypeOf("object");
  });
});
