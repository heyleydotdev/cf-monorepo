import path from "node:path";
import type { D1Migration } from "@cloudflare/vitest-plugin";
import { readD1Migrations } from "@cloudflare/vitest-plugin";

/**
 * The migrations `wrangler.jsonc` points `migrations_dir` at, parsed in Node
 * where the filesystem is reachable. `readD1Migrations` splits each file with
 * wrangler's own SQL splitter and sorts by the numeric prefix, so the order
 * matches `wrangler d1 migrations apply`.
 *
 * Handed to the worker through `test.provide`: a setup file cannot import it,
 * because that would pull node builtins into the Workers runtime.
 */
export const d1Migrations: D1Migration[] = await readD1Migrations(
  path.resolve(import.meta.dirname, "../../../packages/db/migrations"),
);

declare module "vitest" {
  export interface ProvidedContext {
    migrations: D1Migration[];
  }
}
