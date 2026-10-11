import { Hono } from "hono";

import type { APIAssertBindings, APIBindings } from "@acme/api";
import { createApi } from "@acme/api";

// Compile-time only: fails here if wrangler types a binding the API reads that
// this Worker does not bind. The underscore keeps lint quiet, since it is unused.
type _CheckBindings = APIAssertBindings<Env, APIBindings>;

const app = new Hono<{ Bindings: Env }>();

app.route("/api", createApi());

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
