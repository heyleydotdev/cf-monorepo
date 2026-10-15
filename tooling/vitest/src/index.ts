import { d1Migrations, d1SetupFile } from "./d1.ts";

/** Entries for `test.setupFiles`. Each runs inside the Workers runtime. */
export const setupFiles: string[] = [d1SetupFile];

/** Entries for `test.provide`, readable in a setup file through `inject`. */
export const provide = { migrations: d1Migrations };

// Up from vitest's 5s default: the first test in a file absorbs the Worker's cold
// start, which under `turbo run --force` stretches past 5s.
export const testTimeout = 15_000;
