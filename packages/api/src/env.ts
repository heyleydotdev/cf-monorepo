/**
 * The bindings the API reads. Kept here rather than on each route module so
 * there is one contract for the package.
 */
export type APIBindings = {
  DB: D1Database;
};

/**
 * Compile-time only: asserts a host's generated `Env` satisfies what the API
 * declares. A binding the API needs but the Worker does not bind fails here
 * rather than as a runtime undefined. Extra bindings on the Worker are fine.
 *
 * Every host that mounts `createApi` needs one of these. Hono's own generics do
 * not catch the mismatch, so this line is the only thing standing between a
 * missing binding and a 500:
 *
 *   type _CheckBindings = APIAssertBindings<Env, APIBindings>;
 *
 * The leading underscore keeps the lint quiet, since the alias is unused.
 */
export type APIAssertBindings<T extends U, U> = T;
