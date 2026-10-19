"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Note } from "@acme/core/schemas/notes";
import { formatDate, timeAgo } from "@acme/core/utils/time";
import { Alert } from "@acme/ui/components/alert";
import { Button } from "@acme/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/components/card";
import { Field, FieldError } from "@acme/ui/components/field";
import { Input } from "@acme/ui/components/input";
import { Spinner } from "@acme/ui/components/spinner";
import { Textarea } from "@acme/ui/components/textarea";
import { Icons } from "@acme/ui/lib/icons";
import { cn } from "@acme/ui/lib/utils";

import type { listNotes } from "~/app/actions";
import { createNote, deleteNote, updateNote } from "~/app/actions";
import { rpcClient } from "~/rpc/client";

type Note = Awaited<ReturnType<typeof listNotes>>[number];

type NotesProps = {
  notes: Note[];
  time: { iso: string };
};

export function Notes({ notes, time }: NotesProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Notebook notes={notes} time={time} />
    </QueryClientProvider>
  );
}

function Notebook({ notes, time }: NotesProps) {
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<Note | null>(null);

  const onError = useCallback(
    (err?: string | null) => setError(err && err.length > 0 ? err : null),
    [],
  );

  const onEdit = useCallback(
    (id: number | null) => {
      setEdit(notes.find((item) => item.id == id) ?? null);
    },
    [notes],
  );

  return (
    <div className="h-full">
      <Card className="isolate container min-h-full gap-0 overflow-visible pt-0">
        <CardHeader className="bg-card sticky top-0 z-50 border-b pt-(--card-spacing)">
          <CardTitle>Notebook</CardTitle>
          <CardDescription>
            Just a notebook for your notes, ideas, and anything else you want to
            write down.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-muted flex-1 px-0">
          {notes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              editing={note.id === edit?.id}
              onEdit={onEdit}
              onError={onError}
            />
          ))}
        </CardContent>
        <CardFooter className="bg-background sticky bottom-0 z-50 flex-col gap-(--card-spacing)">
          {error && (
            <Alert
              variant="destructive"
              className="border-t-destructive bg-destructive text-primary-foreground -mx-(--card-spacing) border-0 border-t"
            >
              {error}
            </Alert>
          )}
          {edit && (
            <div className="bg-muted grid w-full grid-cols-[1fr_auto] gap-(--card-spacing) pl-3">
              <p className="line-clamp-1 self-center overflow-hidden">
                Editing: {edit.title}
              </p>
              <Button onClick={() => onEdit(null)}>Cancel</Button>
            </div>
          )}
          <NoteForm
            key={edit?.id ?? "new"}
            note={edit}
            onEdit={onEdit}
            onError={onError}
          />
          <ServerTime initial={time} />
        </CardFooter>
      </Card>
    </div>
  );
}

const REFETCH_MS = 5_000;

const serverTimeFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  fractionalSecondDigits: 3,
  timeZone: "UTC",
});

function ServerTime({ initial }: { initial: { iso: string } }) {
  const queryClient = useQueryClient();
  const { data } = useQuery(
    rpcClient.time.queryOptions({
      initialData: initial,
      staleTime: REFETCH_MS,
      refetchInterval: REFETCH_MS,
    }),
  );

  return (
    <div className="bg-muted grid w-full grid-cols-[auto_1fr_auto]">
      <div className="bg-foreground content-center px-3">
        <p className="text-background">Server Time</p>
      </div>
      <p className="line-clamp-1 self-center overflow-hidden text-center tabular-nums">
        {serverTimeFormat.format(new Date(data.iso))} UTC
      </p>
      <Button
        onClick={() =>
          queryClient.invalidateQueries({ queryKey: rpcClient.time.queryKey() })
        }
      >
        Refresh
      </Button>
    </div>
  );
}

function NoteItem(props: {
  note: Note;
  editing: boolean;
  onEdit: (id: number | null) => void;
  onError?: (err?: string | null) => void;
}) {
  const { note, editing, onEdit, onError } = props;
  const router = useRouter();

  const onDelete = useCallback(async () => {
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) {
      return;
    }

    onEdit(null);
    onError?.(null);

    const res = await deleteNote({ id: note.id }).catch(() => null);

    if (!res) {
      onError?.("Could not delete the note");
      return;
    }

    if (res.status === "ok") {
      router.refresh();
      return;
    }

    if (res.status === "invalid") {
      onError?.(
        res.issues.fieldErrors["id"]?.[0]?.message ?? "Input validation failed",
      );
      return;
    }

    onError?.(res.message);
  }, [note.id, note.title, onEdit, onError, router]);

  return (
    <div
      className={cn(
        "group hover:bg-background grid grid-cols-[1fr_auto_auto] gap-1 border-b bg-transparent p-(--card-spacing) transition-colors last:border-b-0",
        editing && "bg-primary/20 hover:bg-primary/15",
      )}
    >
      <div className="self-center">
        <h4 className="text-foreground text-sm/6 font-medium text-balance">
          {note.title}&nbsp;
          <time
            className="text-muted-foreground text-[11px]/6 font-normal"
            dateTime={note.createdAt.toISOString()}
            title={formatDate(note.createdAt)}
          >
            ( {timeAgo(note.createdAt)} )
          </time>
        </h4>
        {note.body && (
          <p className="text-muted-foreground mt-1 text-balance">{note.body}</p>
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        aria-label="Edit note"
        onClick={() => onEdit(note.id)}
      >
        <Icons.edit />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
        aria-label="Delete note"
        onClick={onDelete}
      >
        <Icons.delete />
      </Button>
    </div>
  );
}

function NoteForm(props: {
  note?: Note | null;
  onEdit: (id: number | null) => void;
  onError?: (err?: string | null) => void;
}) {
  const { note, onEdit, onError } = props;
  const router = useRouter();
  const titleRef = useRef<React.ComponentRef<typeof Input>>(null);

  const form = useForm({
    defaultValues: {
      title: note?.title ?? "",
      body: note?.body ?? "",
    },
    validators: {
      onSubmit: Note.required({ body: true }),
    },
    onSubmit: async ({ value, formApi }) => {
      const res = await (
        note ? updateNote({ id: note.id, ...value }) : createNote(value)
      ).catch(() => null);

      if (!res) {
        onError?.("Could not save the note");
        return;
      }

      if (res.status === "ok") {
        formApi.reset();
        onEdit(null);
        router.refresh();
        return;
      }

      if (res.status === "invalid") {
        return formApi.setErrorMap({
          onSubmit: { fields: res.issues.fieldErrors },
        });
      }

      onError?.(res.message);
    },
  });

  useEffect(() => {
    if (note?.id) {
      titleRef.current?.select();
    }
  }, [note?.id]);

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onError?.(null);
        form.handleSubmit();
      }}
    >
      <div className="grid grid-cols-[1fr_--spacing(8)] gap-(--card-spacing)">
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <Input
                  id={field.name}
                  ref={titleRef}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g. Deploy checklist"
                  autoComplete="off"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <form.Field
          name="body"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid} className="col-span-2">
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Anything else worth remembering (optional)"
                  className="resize-none"
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              size="icon"
              type="submit"
              aria-label={note ? "Save note" : "Add note"}
              className="col-start-2 row-start-1"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <Spinner />
              ) : note ? (
                <Icons.save />
              ) : (
                <Icons.send />
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
