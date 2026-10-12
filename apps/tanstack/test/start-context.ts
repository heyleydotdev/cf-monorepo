import type { StartStorageContext } from "@tanstack/start-storage-context";
import { runWithStartContext } from "@tanstack/start-storage-context";

/**
 * A server function is meant to be called from inside a request. Outside one it
 * throws `No Start context found in AsyncLocalStorage`, so a test has to supply
 * that context before calling the fetcher.
 *
 * The notes handlers never touch the router, so `getRouter` throws if something
 * later reaches for it. `startOptions` is undefined because there is no Start
 * instance in a test, and `executeMiddleware` reads it for global function
 * middlewares.
 *
 * This imports `@tanstack/start-storage-context`, which Start does not export
 * publicly or declare as a dependency of this app. It is pinned in
 * `package.json` so a Start upgrade cannot silently move it.
 */
export function withStartContext<T>(fn: () => T): Promise<T> {
  const context: StartStorageContext = {
    getRouter: () => {
      throw new Error("getRouter is not available in a unit test");
    },
    request: new Request("https://example.com/"),
    startOptions: undefined,
    contextAfterGlobalMiddlewares: undefined,
    executedRequestMiddlewares: new Set(),
    handlerType: "serverFn",
  };

  return runWithStartContext(context, fn);
}
