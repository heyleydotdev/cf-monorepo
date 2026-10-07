import { createFileRoute } from "@tanstack/react-router";

import { apiClient } from "~/lib/api-client";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => {
    try {
      const res = await apiClient.health.$get();
      const data = await res.json();

      return JSON.stringify(data, undefined, 2);
    } catch (error) {
      return JSON.stringify(
        { error: error instanceof Error ? error.message : "Failed to fetch" },
        undefined,
        2,
      );
    }
  },
});

function Home() {
  return (
    <main>
      <pre>{Route.useLoaderData()}</pre>
    </main>
  );
}
