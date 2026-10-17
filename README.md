<div align="center">

# Cloudflare Monorepo

A Bun + Turborepo boilerplate for Cloudflare Workers. Two deployable apps sharing one service layer, with a worked notes example that touches every layer.

[![Bun](https://img.shields.io/badge/Bun-1.4.2-black?style=flat-square&logo=bun)](https://bun.sh)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.18-3c873a?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Turborepo](https://img.shields.io/badge/Turborepo-2-ef4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020?style=flat-square&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/workers/)

[Workspaces](#workspaces) • [Quick start](#quick-start) • [The notes example](#the-notes-example) • [Commands](#commands) • [How it fits together](#how-it-fits-together) • [Things that will bite](#things-that-will-bite)

</div>

No framework opinions beyond the wiring. The notes example is here to be deleted, and everything under it — the service layer, the schemas, the D1 setup, the shared tooling — is meant to outlive it.

## Workspaces

| Workspace       | What it is                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `apps/server`   | Cloudflare Worker. Mounts `packages/api`, wrangler config, vitest in the Workers runtime.                                          |
| `apps/tanstack` | TanStack Start app. React SSR, file-based routing, Tailwind 4, deployed through the Cloudflare Vite plugin.                        |
| `packages/api`  | oRPC router plus the REST and RPC fetch handlers. Mounted by `apps/server` at `/api`, and as RPC by `apps/tanstack` at `/api/rpc`. |
| `packages/core` | Transport-agnostic logic: the notes service, the zod schemas, shared helpers. Imported as TypeScript source.                       |
| `packages/ui`   | React components plus the Tailwind theme. React is a peer dependency rather than bundled, so the app supplies React.               |
| `packages/db`   | Drizzle on D1. Typed client plus the schema; `bun run generate` writes SQL that `wrangler d1 migrations apply` runs.               |
| `tooling/*`     | Shared tsconfig, eslint, prettier and vitest harnesses, as `@acme/*` packages.                                                     |

## Requirements

- [bun](https://bun.sh) 1.4.2, the only supported package manager
- Node 22.18 or newer, or bun itself, to run the tests. `@acme/vitest` is imported by each `vitest.config.ts`, which Node loads rather than bundles, so it is read as TypeScript and needs a runtime that strips types.
- A Cloudflare account, only to deploy. Local dev runs in miniflare.

## Quick start

```sh
git clone https://github.com/heyleydotdev/cf-monorepo && cd cf-monorepo
cp .env.example .env     # nothing here is required to boot
bun install
bun run dev              # server on :3001, tanstack on :3000
```

> [!IMPORTANT]
> `bun install` then `bun run typecheck` matters after a fresh clone: packages are consumed as TypeScript source, so the first typecheck is what emits the declaration files dependents resolve types through.

The notes page reads and writes D1 through a server function, so it needs the schema applied once:

```sh
cd apps/tanstack && bun run migrate
```

Local D1 needs no Cloudflare account. Deploying does — create the database, then paste its id over the placeholder in `wrangler.jsonc`:

```sh
wrangler d1 create acme-db
```

## The notes example

A worked example of the whole stack, small enough to read in one sitting and delete when it has served its purpose:

| Layer            | File                                                         |
| ---------------- | ------------------------------------------------------------ |
| Table            | `packages/db/src/schema.ts`                                  |
| Queries          | `packages/core/src/services/notes.service.ts`                |
| Validation       | `packages/core/src/schemas/notes.schema.ts`                  |
| HTTP routes      | `packages/api/src/routes/notes.ts`                           |
| RPC endpoint     | `apps/tanstack/src/routes/api/rpc.$.ts`                      |
| Server functions | `apps/tanstack/src/lib/notes.ts`                             |
| Components       | `packages/ui/src/components/*.tsx` (shadcn)                  |
| Page             | `apps/tanstack/src/routes/index.tsx`                         |
| Tests            | `apps/server/test/*.spec.ts`, `apps/tanstack/test/*.spec.ts` |

Every path reaches the same `@acme/core` service: the TanStack app through server functions that run inside its own Worker, the Worker app through `packages/api` mounted at `/api`, and callers outside this repo through the same router mounted as RPC at `/api/rpc`. Change the service and they change together.

## Commands

Every task runs through Turbo, so `--filter` scopes any of them.

```sh
bun run dev            # all dev servers, watching
bun run build          # bundle the apps; no package emits anything
bun run typecheck
bun run test
bun run lint
bun run format         # check
bun run format:write   # fix
bun run generate       # drizzle-kit generate: schema change -> SQL
bun run migrate        # apply pending SQL to local D1
bun run migrate:remote # apply pending SQL to the deployed D1
bun run typegen        # wrangler types -> each app's worker-configuration.d.ts
```

`format` also covers the repository root through a `//#format:root` task, since no package owns `README.md`, `AGENTS.md` or `turbo.json`.

> [!IMPORTANT]
> Add `--force` when the change is in a shared package. Turbo hashes a task on that workspace's own files, not on a transitive dependency's source, so editing `packages/*` can replay a stale green result.

```sh
bunx turbo <task> --filter=@acme/tanstack
bunx turbo test --filter=@acme/server
```

Per-app scripts live in each workspace and run without the Turbo wrapper:

```sh
cd apps/server
bun run test           # vitest in the Workers runtime
bun run typegen        # wrangler types -> worker-configuration.d.ts
bun run deploy         # wrangler deploy

cd apps/tanstack
bun run typegen
bun run migrate        # local D1; migrate:remote for the deployed one
bun run deploy         # build, then wrangler deploy
```

## How it fits together

**Packages ship source, not a build.** Every package maps `types` and `default` at the same `src/*.ts` path, so nothing is compiled and there is no `dist`. `tsc` reads a dependency source directly and the bundler does the rest.

**One dialect of everything.** `tooling/*` are real workspace packages, so a config change lands everywhere on the next install rather than drifting per app. Every workspace sets `"prettier": "@acme/prettier"`.

**One Tailwind theme.** `packages/ui` exports `globals.css`, which holds the `@import "tailwindcss"` and the `@theme` tokens alongside the components that consume them. An app imports it once and adds only what is specific to that app:

```css
@import "@acme/ui/globals.css";
```

Tailwind emits only the utilities a page actually uses, so an app with no utility classes in it still gets preflight and the tokens, and nothing more.

Tailwind scans from the app root, so classes written inside `packages/*` are invisible and get dropped with no warning. An app declares the packages it renders:

```css
@source "../../../packages/ui/src";
```

List them rather than globbing `packages/*/src/*`. A glob works, but a class in a package the app never renders still reaches the output, and two frontends sharing `packages/ui` would each ship CSS for components they do not use. Add a line per package instead.

One trap in either form: a wildcard in a middle path segment matches nothing, so `packages/*/src` looks right and silently scans nothing.

**One generated file is ignored, one is committed.** `routeTree.gen.ts` is gitignored and rebuilt by `generate-routes`, which `build`, `lint`, and `typecheck` depend on. Each app's `worker-configuration.d.ts` is committed, so a fresh clone typechecks against the bindings it will deploy; re-run `bun run typegen` after editing that app's `wrangler.jsonc`.

**One tsconfig per runtime.** Both apps use a root tsconfig with project references and nothing else, so each file is compiled under the types it actually runs with. `apps/server` splits app from test; `apps/tanstack` splits `src` from `vite.config.ts` and the eslint config, which run in Node rather than the browser. `build` runs `tsc -b`, which walks the references.

A library that reads a Workers global declares `types` itself rather than switching base config. `packages/api`, `core` and `db` all extend `source-package.json` and override `types: ["@cloudflare/workers-types"]` — reaching for `worker.json` would drag `module: "es2022"` in with it. `worker.json` is for the apps.

**Shared versions come from the catalog.** `workspaces.catalog` in the root `package.json` pins prettier, typescript, eslint, react and their types. Reference them as `"catalog:"`.

**Three ways in, one router.** `apps/server` mounts the `handler` from `packages/api` at `/api` — that is the external HTTP surface, the same procedures served as REST by oRPC's OpenAPI adapter, with paths and methods taken from each procedure's `openapi()` metadata. `apps/tanstack` mounts `rpcHandler` at `/api/rpc`, the same procedures over oRPC's own RPC protocol, for any oRPC client typed by `Router`. That is not what the app itself calls: its loaders use the server functions in `src/lib/notes.ts`, which reach the procedures through `createRouterClient` without a request leaving the Worker, where mounting a handler would mean a loader fetching its own origin over HTTP. No path can disagree about behaviour, because a procedure owns its own validation and every path runs the same procedure — the two handlers even share one `errorStatusMap`, so they cannot disagree about a status either.

**The client is typed from the router.** `router` is a concrete const, so `createRouterClient(router, { context })` infers every procedure's input, output and declared errors. A procedure that does not exist fails to compile, and no call site needs a hand-written type. A factory return type would lose the procedure literals and infer `unknown`, which is why `router` stays a value. The same router generates the OpenAPI document behind the HTTP surface, so the REST description and the typed client cannot drift apart.

## Adding a workspace

Copy `packages/core` for a library, or `apps/server` for a Worker:

```
packages/<name>/
  package.json       "@acme/<name>", private, "type": "module"
  tsconfig.json      extends @acme/tsconfig/source-package.json, include src
  eslint.config.js   spreads @acme/eslint/base, points parserOptions at tsconfig
  src/index.ts
```

The tsconfig to extend depends on where it runs:

| Extends                                | For                                    |
| -------------------------------------- | -------------------------------------- |
| `@acme/tsconfig/source-package.json`   | a library consumed as source, no build |
| `@acme/tsconfig/worker.json`           | an app deployed as a Worker            |
| `@acme/tsconfig/browser.json`          | browser code with JSX                  |
| `@acme/tsconfig/node.json`             | Node scripts and config files          |
| `@acme/tsconfig/compiled-package.json` | only for a package published to npm    |

A library that needs a runtime global overrides `types` on top of the neutral base rather than picking a runtime-specific one.

## Things that will bite

> [!WARNING]
> **`bun run test`, never `bun test`.** Bun's own runner never reads `vitest.config.ts`, so the Workers pool and the `cloudflare:test` imports do not exist and every spec fails to import. Same four letters, different runtime.

> [!CAUTION]
> **prettier must stay on 3.5 or newer.** Below that, `@ianvs/prettier-plugin-sort-imports` silently drops type arguments. `Promise<Response>` becomes `Promise`. `format` reports success, so `typecheck` is what catches it.

> [!WARNING]
> **The two apps keep separate local D1.** Each has its own `.wrangler/state`, so a note created while running `apps/server` is invisible to `apps/tanstack` until deploy, where the shared `database_id` makes them one database. Run `bun run migrate` in whichever app you are working in.

- **Every workspace that runs prettier needs it in its own devDependencies.** Without it the shell falls through to a global install at whatever version happens to be there.
- **Keep import specifiers extensionless.** A `.ts` or `.js` extension in a source import gets written into the emitted `.d.ts` and breaks dependents. `allowImportingTsExtensions` in `apps/tanstack` is safe there, since nothing consumes its declarations.
- **`~/*` needs three halves.** In `apps/tanstack` it resolves through tsconfig `paths`, plus `resolve.tsconfigPaths` in _both_ Vite configs — `vite.config.ts` for build and dev, `vitest.config.ts` for tests. Miss the test one and nothing fails until a spec loads a route module through the router, because the specs that import `src/` files directly never resolve it.
- **`wrangler.jsonc` `dev.port` must be a number.** The string form is rejected by `wrangler types`, so `bun run typegen` is where you find out.
- **Secrets go through `wrangler secret put`,** never `wrangler.jsonc`. Local dev reads the root `.env` through `--env-file ../../.env`.
- **Public env vars use the `VITE_` prefix.** That is Vite's default `envPrefix` and matches what Turbo hashes automatically, so a change busts the cache with no `env` entry to keep in sync. The root `.env` itself is covered by `globalDependencies: [".env*"]`. `eslint-config-turbo` fails the lint when a variable is read but never declared.
- **A `VITE_` var cannot hold a URL the Worker needs at request time.** Vite compiles it into both bundles, so a deployed build uses whichever value was set when it was built, and `wrangler secret put` cannot change it. If a server-only value is needed, it is not a Vite var at all: pass it through the Worker or read a binding. A genuinely public one still belongs in `ImportMetaEnv`.
- **`.gitattributes` forces LF.** Without it a Windows checkout with `core.autocrlf=true` rewrites files as CRLF, prettier's `endOfLine: "lf"` rejects the tree, and `git status` shows changes with no diff.
- **`wrangler types` can emit unused eslint-disable directives** into `worker-configuration.d.ts`. They are warnings, not errors, and regenerating the file brings them back.
- **`bun run clean` runs `git clean -xdf`,** so it only works inside a git checkout.

## For agents and contributors

`AGENTS.md` holds the conventions an agent should follow: the verify order, the rules on generated files, and the traps that are specific to this setup rather than general. The list above applies to agents too. Run `bun run format`, then `typecheck`, then `test`, then `lint`. Prettier can break types here, so typecheck right after it.
