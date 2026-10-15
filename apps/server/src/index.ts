import { handler } from "@acme/api";

/** The API is a fetch handler, so the Worker exports it directly. */
export default {
  fetch: async (request, env) => {
    const { matched, response } = await handler.handle(request, {
      context: {
        Env: { DB: env.DB },
      },
    });

    if (matched) {
      return response;
    }

    return new Response("Not Found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
