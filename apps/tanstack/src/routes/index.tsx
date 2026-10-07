import { createFileRoute } from "@tanstack/react-router";

import { Button, Card } from "@acme/ui";

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
    <main className="p-8">
      <Card>
        <pre className="mt-4 font-mono text-sm text-zinc-500">
          {Route.useLoaderData()}
        </pre>
        <Button className="mt-6">Ping</Button>
      </Card>
    </main>
  );
}
