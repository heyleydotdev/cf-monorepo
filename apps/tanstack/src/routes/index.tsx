import { useCallback, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { formatDate, timeAgo } from "@acme/core";
import { Note } from "@acme/core/notes.schema";
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

import { createNoteFn, deleteNoteFn, listNotesFn } from "~/lib/notes";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => listNotesFn(),
});

function RouteComponent() {
  const notes = Route.useLoaderData();
  const [error, setError] = useState<string | null>(null);

  const onError = useCallback(
    (err?: string | null) => setError(err && err.length > 0 ? err : null),
    [],
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
            <NoteItem key={note.id} note={note} onError={onError} />
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
          <NoteForm onError={onError} />
        </CardFooter>
      </Card>
    </div>
  );
}

function NoteItem(props: {
  note: Awaited<ReturnType<typeof listNotesFn>>[number];
  onError?: (err?: string | null) => void;
}) {
  const { note, onError } = props;
  const router = useRouter();

  const onDelete = useCallback(async () => {
    if (!confirm(`Delete "${note.title}"? This cannot be undone.`)) {
      return;
    }

    onError?.(null);

    const res = await deleteNoteFn({ data: { id: note.id } }).catch(() => null);

    if (!res) {
      onError?.("Could not delete the note");
      return;
    }

    if (res.status === "ok") {
      await router.invalidate({ sync: true });
      return;
    }

    if (res.status === "invalid") {
      onError?.(
        res.issues.fieldErrors["id"]?.[0]?.message ?? "Input validation failed",
      );
      return;
    }

    onError?.(res.message);
  }, [note.id, note.title, onError, router]);

  return (
    <div className="group hover:bg-background grid grid-cols-[1fr_auto_auto] gap-1 border-b bg-transparent p-(--card-spacing) last:border-b-0">
      <div className="self-center">
        <h4 className="text-foreground text-sm/6 font-medium text-balance">
          {note.title}&nbsp;
          <time
            className="text-muted-foreground text-[11px]/6 font-normal"
            dateTime={note.updatedAt.toISOString()}
            title={formatDate(note.updatedAt)}
          >
            ( {timeAgo(note.updatedAt)} )
          </time>
        </h4>
        {note.body && (
          <p className="text-muted-foreground mt-1 text-balance">{note.body}</p>
        )}
      </div>
      <Button variant="outline" size="icon" aria-label="Edit note">
        <Icons.edit />
      </Button>
      <Button
        variant="outline"
        size="icon"
        aria-label="Delete note"
        onClick={onDelete}
      >
        <Icons.delete />
      </Button>
    </div>
  );
}

function NoteForm(props: { onError?: (err?: string | null) => void }) {
  const router = useRouter();

  const form = useForm({
    defaultValues: {
      title: "",
      body: "",
    },
    validators: {
      onSubmit: Note.required({ body: true }),
    },
    onSubmit: async ({ value, formApi }) => {
      const res = await createNoteFn({ data: value }).catch(() => null);

      if (!res) {
        props.onError?.("Could not save the note");
        return;
      }

      if (res.status === "ok") {
        formApi.reset();
        await router.invalidate({ sync: true });
      }

      if (res.status === "invalid") {
        return formApi.setErrorMap({
          onSubmit: { fields: res.issues.fieldErrors },
        });
      }

      if (res.status === "error") {
        props.onError?.(res.message);
      }
    },
  });

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onError?.(null);
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
                  rows={4}
                  className="h-20 resize-none"
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
              className="col-start-2 row-start-1"
              disabled={!canSubmit}
            >
              {isSubmitting ? <Spinner /> : <Icons.send />}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
