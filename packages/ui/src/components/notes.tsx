import type { ReactNode } from "react";
import { useCallback } from "react";

import type { NoteInput } from "@acme/core/notes.schema";
import { formatDate, timeAgo } from "@acme/core";

import { cn } from "../utils";
import { Alert } from "./alert";
import { Button } from "./button";
import { Input, Textarea } from "./input";

export type NoteItem = {
  id: number;
  title: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

export function NotesShell({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-6 py-10">{children}</div>;
}

export function NotesHeader({ count }: { count: number }) {
  return (
    <header className="flex items-baseline justify-between gap-4">
      <h1 className="text-xl font-semibold tracking-tight">Notes</h1>
      <p className="text-sm text-zinc-600">
        {count} {count === 1 ? "note" : "notes"}
      </p>
    </header>
  );
}

export function NotesList({
  notes,
  children,
}: {
  notes: Array<NoteItem>;
  children: (note: NoteItem) => ReactNode;
}) {
  if (notes.length === 0) {
    return (
      <p className="rounded-xl border border-dashed py-12 text-center text-sm text-zinc-400">
        Your notes will appear here.
      </p>
    );
  }

  return (
    <ul className="border-border flex flex-col divide-y rounded-lg border">
      {notes.map((note) => (
        <li key={note.id}>{children(note)}</li>
      ))}
    </ul>
  );
}

export function NoteCard({
  note,
  isPending,
  onEdit,
  onDelete,
  children,
}: {
  note: NoteItem;
  isPending?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  children?: ReactNode;
}) {
  const isEditing = children !== undefined;

  return (
    <div
      className={cn(
        "group flex items-start gap-4 px-4 py-3 transition",
        isPending && "opacity-60",
      )}
    >
      {isEditing ? (
        <div className="min-w-0 flex-1">{children}</div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm/6 font-medium text-balance text-zinc-900">
              {note.title}
            </h3>
            {note.body ? (
              <p className="line-clamp-3 text-sm/6 whitespace-pre-wrap text-zinc-600">
                {note.body}
              </p>
            ) : null}
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" variant="ghost" size="xs" onClick={onEdit}>
                Edit
              </Button>
              <Button
                type="button"
                variant="ghostDestructive"
                size="xs"
                onClick={onDelete}
              >
                Delete
              </Button>
            </div>
          </div>
          <div className="shrink-0">
            <time
              dateTime={note.createdAt.toISOString()}
              title={formatDate(note.createdAt)}
              className="mt-0.5 block text-xs/6 text-zinc-400"
            >
              {timeAgo(note.createdAt)}
            </time>
          </div>
        </>
      )}
    </div>
  );
}

export type NoteFormProps = {
  ref?: React.Ref<HTMLFormElement>;
  note?: NoteItem;
  submitLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onSubmit: (values: NoteInput) => void;
  onCancel?: () => void;
};

export function NoteForm({
  ref,
  note,
  submitLabel = "Add note",
  isPending,
  error,
  onSubmit: submit,
  onCancel,
}: NoteFormProps) {
  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = useCallback(
    (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      submit({
        title: String(data.get("title")),
        body: String(data.get("body")),
      });
    },
    [submit],
  );

  return (
    <form ref={ref} onSubmit={onSubmit}>
      <fieldset className="flex flex-col gap-3" disabled={isPending}>
        <Input
          name="title"
          defaultValue={note?.title}
          required
          maxLength={200}
          placeholder="e.g. Deploy checklist"
        />
        <Textarea
          name="body"
          defaultValue={note?.body}
          rows={3}
          placeholder="Anything else worth remembering (optional)"
        />
        {error ? <Alert>{error}</Alert> : null}
        <div className="flex items-center gap-2">
          <Button type="submit">{submitLabel}</Button>
          {onCancel ? (
            <Button
              type="button"
              className="bg-transparent text-zinc-600 hover:bg-zinc-100"
              onClick={onCancel}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </fieldset>
    </form>
  );
}
