import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="grid h-[calc(100vh-var(--header-height))] grid-cols-1 grid-rows-[1fr_1fr_3fr] text-center">
      <div className="row-start-2 flex flex-col gap-4">
        <h1 className="text-3xl font-semibold tracking-tighter text-balance">
          Cloudflare Monorepo Boilerplate
        </h1>
        <p className="text-sm/6 text-balance text-zinc-600">
          A modern monorepo for building and deploying large, scalable
          applications on Cloudflare. Start with sensible defaults and shape it
          to fit your stack.
        </p>
      </div>
    </div>
  );
}
