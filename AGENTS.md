<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->

# Agent Instructions

## Package Manager

**bun 1.4.2** (`bun.lock`). Never npm, yarn, or pnpm. Shared versions live in the root `workspaces.catalog`; reference them as `"catalog:"`.

## Commands

| Task                 | Command                                              |
| -------------------- | ---------------------------------------------------- |
| All tests            | `bun run test`                                       |
| One test file        | `cd apps/server && bunx vitest run test/api.spec.ts` |
| Lint one workspace   | `bunx turbo lint --filter=@acme/core`                |
| Format one workspace | `bunx turbo format --filter=@acme/tanstack`          |
| Apply D1 migrations  | `cd apps/tanstack && bun run migrate`                |
| Scope any task       | `bunx turbo <task> --filter=@acme/<pkg>`             |

## Verify Before Reporting

`bun run format` → `bun run typecheck` → `bun run test` → `bun run lint`. Add `--force` when the change is in a shared package: turbo hashes a task on that workspace's own files, **not** on a transitive dependency's source, so editing `packages/*` can replay a stale green result.

## Traps

**Read the Troubleshooting section in `README.md` first.** It covers the runners, prettier versions, the `~/*` alias halves, `dev.port`, the `VITE_` prefix, and the two apps' separate local D1. The entries below are not in it.

- **`includeIgnoreFile` needs `gitignoreResolution: true`.** `@acme/eslint` lives in `tooling/eslint/`, so the default resolves root `.gitignore` patterns against that directory, matches nothing, and looks like it works.
- **`ViteTypeOptions.strictImportMetaEnv` is what makes env vars type-checked.** Without it vite types `import.meta.env` as `Record<string, any>`, so a misspelling compiles and inlines as `undefined`.
- **Do not override `envPrefix` to avoid the `VITE_` prefix.** A custom prefix must also be declared in turbo's task `env` and in `ImportMetaEnv`; miss one and it is a stale bundle or a type error.
- **The OpenAPI reference plugin ignores the router's `openapi()` prefix.** Its `docsPath` and `specPath` resolve against the handle-time `prefix`, which `apps/server` does not pass, so they stay absolute (`/docs`, `/docs/spec.json`) while procedures sit under `/api`. Passing `prefix: "/api"` to `handle()` double-prefixes the procedures instead of moving the docs.

## Key Conventions

- No package compiles: `types` and `default` both point at `src/*.ts`, no `dist`, no `build` script. `@acme/tsconfig/compiled-package.json` is the npm-published exception and is currently unused.
- `apps/tanstack/src/routeTree.gen.ts` is generated and gitignored. Regenerate with `bunx turbo generate-routes --filter=@acme/tanstack`; `build`, `typecheck` and `lint` depend on it.
- Both apps have a committed `worker-configuration.d.ts` from `bun run typegen`. Re-run typegen after touching that app's `wrangler.jsonc`, commit the result, and keep the file in the app's tsconfig `include` or its bindings do not resolve.
- Both apps typecheck through project references, so `eslint.config.js` must list every referenced tsconfig in `parserOptions.project`.
- `typecheck` waits on `typecheck-transit`, not `^typecheck`, so a dependency change invalidates a dependent without serializing every package first.
- A new public env var needs an `ImportMetaEnv` entry in `apps/tanstack/src/env.d.ts` and nothing in `turbo.json`.
- Root files are formatted by the `//#format:root` task. A new root file type means a new glob in `turbo.json` and in both `format:root` scripts; the globs skip `bun.lock` and `.env.example` on purpose.
- `packages/api` keeps `router` a concrete const: `restHandler` (REST) and `rpcHandler` (RPC) infer from it, as do the OpenAPI document and `createRpcServer`. A factory return type loses the procedure literals and infers `unknown`.
- `packages/api` has no root entry, so the runtime decides the import: `@acme/api/server` is everything that runs on Workers — router, both handlers, `createRpcServer`, `safeCall` — and `@acme/api/client` is the browser's — the link and the TanStack Query utils built on it. The wrong one fails at build rather than at runtime.
- `packages/api` never reads `cloudflare:workers`. `RpcServerContext` declares the bindings and the caller passes them — `restHandler.handle(request, { context: { Env } })`, `createRpcServer({ Env })` — because a shared package cannot name one `Env`.
- `apps/server` mounts `restHandler` at `/api` (Scalar reference at `/docs`, its spec at `/docs/spec.json`); `apps/tanstack` mounts `rpcHandler` at `/api/rpc`, calls `createRpcServer` in-process from its server functions, and reaches the same procedures from the browser through `createRpcClient`.
- File and directory names are lowercase kebab-case, except names a tool dictates: `README.md`, `AGENTS.md`, `bun.lock`, `tsconfig.*.json`, `apps/tanstack/src/routes/__root.tsx`, `routeTree.gen.ts`.

## External References

| Need                            | File        |
| ------------------------------- | ----------- |
| Layout, commands, per-app notes | `README.md` |
