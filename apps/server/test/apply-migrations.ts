import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll, inject } from "vitest";

/**
 * The vitest pool gets its own D1 database, separate from the one
 * `bun run migrate` writes to, so migrations are applied here as well. Without
 * this every test touching the db fails on `no such table`.
 *
 * The migrations are injected rather than imported: reading them needs node
 * builtins, which the Workers runtime does not provide.
 */
beforeAll(async () => {
  await applyD1Migrations(env.DB, inject("migrations"));
});
