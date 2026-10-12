import path from "node:path";
import { fileURLToPath } from "node:url";
import type { D1Migration } from "@cloudflare/vitest-plugin";
import { readD1Migrations } from "@cloudflare/vitest-plugin";

/**
 * The migrations `wrangler.jsonc` points `migrations_dir` at, parsed in Node
 * where the filesystem is reachable. `readD1Migrations` splits each file with
 * wrangler's own SQL splitter and sorts by the numeric prefix, so the order
 * matches `wrangler d1 migrations apply`.
 *
 * Handed to the worker through `test.provide`: the setup file cannot import it,
 * because that would pull node builtins into the Workers runtime.
 */
export const d1Migrations: Array<D1Migration> = await readD1Migrations(
  path.resolve(import.meta.dirname, "../../../packages/db/migrations"),
);

/**
 * Absolute path to the setup file, for `test.setupFiles`:
 *
 *   test: { setupFiles: [d1SetupFile], provide: { migrations: d1Migrations } }
 *
 * A path rather than the module itself, because the setup file has to be loaded
 * by vitest inside the Workers runtime, which no import from the config would
 * achieve.
 */
export const d1SetupFile: string = fileURLToPath(
  new URL("./d1-setup.ts", import.meta.url),
);

declare module "vitest" {
  export interface ProvidedContext {
    migrations: Array<D1Migration>;
  }
}
