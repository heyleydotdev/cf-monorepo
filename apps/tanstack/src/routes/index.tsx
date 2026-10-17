import { useCallback, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";

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

import { createNoteFn, listNotesFn } from "~/lib/notes";

export const Route = createFileRoute("/")({
  component: RouteComponent,
  loader: () => listNotesFn(),
});

function RouteComponent() {
  const notes = Route.useLoaderData();
  const [error, setError] = useState<string | null>(
    "Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quasi at ad architecto minus itaque ipsa! Ut perferendis ex voluptatem earum doloremque, doloribus dolor, quidem sit, maxime accusamus consequatur provident suscipit.",
  );

  const onError = useCallback(
    (err?: string | null) => setError(err && err.length > 0 ? err : null),
    [],
  );

  return (
    <div className="bg-muted h-full">
      <Card className="isolate container min-h-full gap-0 overflow-visible pt-0">
        <CardHeader className="bg-card sticky top-0 z-50 border-b pt-(--card-spacing)">
          <CardTitle>Notebook</CardTitle>
          <CardDescription>
            Just a notebook for your notes, ideas, and anything else you want to
            write down.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 px-0">
          {notes.map((note) => (
            <NoteItem key={note.id} note={note} />
          ))}
        </CardContent>
        {error && (
          <Alert
            variant="destructive"
            className="border-t-destructive bg-destructive text-primary-foreground border-0 border-t"
          >
            {error}
          </Alert>
        )}
        <CardFooter className="bg-background sticky bottom-0 z-50">
          <NoteForm onError={onError} />
        </CardFooter>
      </Card>
    </div>
  );
}

function NoteItem(props: {
  note: Awaited<ReturnType<typeof listNotesFn>>[number];
}) {
  const { note } = props;

  return <div>{note.title}</div>;
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
      const res = await createNoteFn({ data: value });

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
