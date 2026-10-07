import { Hono } from "hono";

/**
 * The HTTP surface, as a Hono app the host Worker mounts:
 * `app.route("/api", createApi())`. Routes live here so the Worker stays a
 * thin entry point.
 *
 * `Bindings` carries the host Worker's bindings. It is generic because this
 * package cannot know the host's `Env`, so `apps/server` supplies it when it
 * mounts the app.
 */
export function createApi<TBindings extends object = Record<string, never>>() {
  const app = new Hono<{ Bindings: TBindings }>();

  app.get("/health", (c) => c.json({ ok: true }));

  return app;
}
