import { useCallback, useRef, useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import type { NoteItem } from "@acme/ui";
import {
  NoteCard,
  NoteForm,
  NotesHeader,
  NotesList,
  NotesShell,
} from "@acme/ui";

import {
  createNoteFn,
  deleteNoteFn,
  listNotesFn,
  updateNoteFn,
} from "~/lib/notes";

export const Route = createFileRoute("/_app/notes")({
  component: RouteComponent,
  loader: () => listNotesFn(),
});

function RouteComponent() {
  const router = useRouter();
  const notes = Route.useLoaderData();

  const formRef = useRef<React.ComponentRef<"form">>(null);
  const [pending, setPending] = useState<number | "create" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAction = useCallback(
    async (
      key: number | "create",
      action: Promise<unknown>,
      onSuccess?: () => void,
    ) => {
      setError(null);
      setPending(key);
      try {
        await action;
        await router.invalidate({ sync: true });
        onSuccess?.();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Something went wrong",
        );
      } finally {
        setPending(null);
      }
    },
    [router],
  );

  return (
    <NotesShell>
      <NotesHeader count={notes.length} />

      <NoteForm
        ref={formRef}
        isPending={pending === "create"}
        error={error}
        onSubmit={(values) =>
          handleAction("create", createNoteFn({ data: values }), () =>
            formRef.current?.reset(),
          )
        }
      />

      <NotesList notes={notes}>
        {(note: NoteItem) => (
          <NoteCard
            note={note}
            isPending={pending === note.id}
            onEdit={() => {
              setError(null);
              setEditingId(note.id);
            }}
            onDelete={() => {
              if (!confirm(`Delete "${note.title}"?`)) return;
              handleAction(note.id, deleteNoteFn({ data: { id: note.id } }));
            }}
          >
            {editingId === note.id ? (
              <NoteForm
                key={note.id}
                note={note}
                submitLabel="Save"
                isPending={pending === note.id}
                error={error}
                onCancel={() => setEditingId(null)}
                onSubmit={(values) =>
                  handleAction(
                    note.id,
                    updateNoteFn({ data: { id: note.id, ...values } }),
                    () => setEditingId(null),
                  )
                }
              />
            ) : undefined}
          </NoteCard>
        )}
      </NotesList>
    </NotesShell>
  );
}
