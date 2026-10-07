# Cloudflare Monorepo

A Bun + Turborepo monorepo boilerplate for Cloudflare Workers. Two deployable apps, one shared package, and the tooling to keep them consistent. No framework opinions beyond the wiring.

| Workspace       | What it is                                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `apps/server`   | Cloudflare Worker. Mounts `packages/api`, wrangler config, vitest in the Workers runtime, holds the whole test suite. |
| `apps/tanstack` | TanStack Start app. React SSR, file-based routing, Tailwind 4, deployed through the Cloudflare Vite plugin. |
| `packages/api`  | Hono app factory. The HTTP surface, mounted by `apps/server`.            |
| `packages/core` | Transport-agnostic logic, plus i18n with one file per language. Imported as TypeScript source.              |
| `tooling/*`     | Shared tsconfig, eslint and prettier configs as `@acme/*` packages.                                         |

## Requirements

- [bun](https://bun.sh) 1.4.2, the only supported package manager
- A Cloudflare account, only to deploy. Local dev runs in miniflare.

## Quick start

```sh
git clone <this-repo> && cd cf-monorepo   # or whatever you cloned it as
cp .env.example .env     # nothing here is required to boot
bun install
bun run dev              # server on :3001, tanstack on :3000
```

`bun install` then `bun run typecheck` matters after a fresh clone: packages are consumed as TypeScript source, so the first typecheck is what emits the declaration files dependents resolve types through.

## Commands

Every task runs through Turbo, so `--filter` scopes any of them.

```sh
bun run dev            # all dev servers, watching
bun run build          # emit dist/*.d.ts for packages, bundle the app
bun run typecheck
bun run test
bun run lint
bun run format         # check
bun run format:write   # fix
```

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
bun run deploy         # build, then wrangler deploy
```

## How it fits together

**Packages ship source, not a bundle.** `packages/core` exports `types` from `dist/*.d.ts` and `default` from `src/*.ts`. Consumers bundle the TypeScript themselves; only declarations are built. That is why `typecheck` depends on `^build` in `turbo.json`.

**One dialect of everything.** `tooling/*` are real workspace packages, so a config change lands everywhere on the next install rather than drifting per app. Every workspace sets `"prettier": "@acme/prettier"`.

**One generated file is ignored, one is committed.** `routeTree.gen.ts` is gitignored and rebuilt by `generate-routes`, which `build`, `lint`, and `typecheck` depend on. `worker-configuration.d.ts` is committed, so a fresh clone typechecks against the bindings it will deploy; re-run `bun run typegen` after editing `wrangler.jsonc`.

**One tsconfig per runtime.** `apps/server` uses a root tsconfig with project references, so app code and tests can carry different `types` while sharing the base. `apps/tanstack` extends one config directly, since a Vite app has a single compilation.

**Shared versions come from the catalog.** `workspaces.catalog` in the root `package.json` pins prettier, typescript, eslint, react and their types. Reference them as `"catalog:"`.

## Adding a workspace

Copy `packages/core` for a library, or `apps/server` for a Worker:

```
packages/<name>/
  package.json       "@acme/<name>", private, "type": "module"
  tsconfig.json      extends @acme/tsconfig/compiled-package.json, include src
  eslint.config.js   spreads @acme/eslint/base, points parserOptions at tsconfig
  src/index.ts
```

The tsconfig to extend depends on where it runs:

| Extends                                | For                                         |
| -------------------------------------- | ------------------------------------------- |
| `@acme/tsconfig/compiled-package.json` | a library, declarations only                |
| `@acme/tsconfig/worker.json`           | a Worker, needs `@cloudflare/workers-types` |
| `@acme/tsconfig/browser.json`          | browser code with JSX                       |
| `@acme/tsconfig/node.json`             | Node scripts and config files               |

## Things that will bite

> **`bun run test`, never `bun test`.** Bun's own runner never reads `vitest.config.ts`, so the Workers pool and the `cloudflare:test` imports do not exist and every spec fails to import. Same four letters, different runtime.

> **prettier must stay on 3.5 or newer.** Below that, `@ianvs/prettier-plugin-sort-imports` silently drops type arguments. `Promise<Response>` becomes `Promise`. `format` reports success, so `typecheck` is what catches it.

- **Every workspace that runs prettier needs it in its own devDependencies.** Without it the shell falls through to a global install at whatever version happens to be there.
- **Keep import specifiers extensionless.** A `.ts` or `.js` extension in a source import gets written into the emitted `.d.ts` and breaks dependents. `allowImportingTsExtensions` in `apps/tanstack` is safe there, since nothing consumes its declarations.
- **`~/*` needs two halves.** In `apps/tanstack` it resolves through tsconfig `paths` _and_ `resolve.tsconfigPaths` in `vite.config.ts`. Change one without the other and the failure shows up at build, not at config time.
- **`wrangler.jsonc` `dev.port` must be a number.** The string form is rejected by `wrangler types`, so `bun run typegen` is where you find out.
- **Secrets go through `wrangler secret put`,** never `wrangler.jsonc`. Local dev reads the root `.env` through `--env-file ../../.env`.
- **`.gitattributes` forces LF.** Without it a Windows checkout with `core.autocrlf=true` rewrites files as CRLF, prettier's `endOfLine: "lf"` rejects the tree, and `git status` shows changes with no diff.
- **`bun run clean` runs `git clean -xdf`,** so it only works inside a git checkout.

## For agents and contributors

`AGENTS.md` holds the conventions an agent should follow: the verify order, the rules on generated files, the alias wiring, and the sharp edges above. Run `bun run format`, then `typecheck`, then `test`, then `lint`. Prettier can break types here, so typecheck right after it.
