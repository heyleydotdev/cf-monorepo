import { createFileRoute } from "@tanstack/react-router";

import { listNotesFn } from "~/lib/notes";

export const Route = createFileRoute("/_app/notes")({
  component: RouteComponent,
  loader: () => listNotesFn(),
});

function RouteComponent() {
  return null;
}
