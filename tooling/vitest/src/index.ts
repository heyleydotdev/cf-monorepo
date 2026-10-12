/**
 * Harnesses shared by every app that runs vitest in the Workers runtime.
 *
 * An app's `vitest.config.ts` spreads `setupFiles` and `provide` into `test`
 * rather than importing each harness, so adding one here reaches both apps
 * without touching either config.
 */
import { d1Migrations, d1SetupFile } from "./d1.ts";

/** Entries for `test.setupFiles`. Each runs inside the Workers runtime. */
export const setupFiles: string[] = [d1SetupFile];

/** Entries for `test.provide`, readable in a setup file through `inject`. */
export const provide = { migrations: d1Migrations };
