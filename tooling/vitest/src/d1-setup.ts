import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll, inject } from "vitest";

/**
 * The D1 binding every app names `DB` in its own config. Declared here rather
 * than imported from `Env`, which is generated per app: a shared package has no
 * single `Env` to name, and the cast is the honest version of that. A rename in
 * an app shows up as this test failing.
 */
const { DB } = env as unknown as { DB: D1Database };

/**
 * The vitest pool gets its own D1 database, separate from the one
 * `bun run migrate` writes to, so migrations are applied here as well. Without
 * this every test touching the db fails on `no such table`.
 *
 * The migrations are injected rather than imported: reading them needs node
 * builtins, which the Workers runtime does not provide.
 *
 * Reached through `setupFiles` rather than imported, because this has to be
 * loaded as a setup file to run inside the Workers runtime.
 */
beforeAll(async () => {
  await applyD1Migrations(DB, inject("migrations"));
});
