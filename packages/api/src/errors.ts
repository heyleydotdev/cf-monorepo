import { error } from "@orpc/server";
import { z } from "zod";

/**
 * A code `errorStatusMap` in router.ts has to know, or it maps to 500. Declared as
 * a factory so a caller can narrow with `instanceof`.
 */
export const NOTE_NOT_FOUND = error("NOTE_NOT_FOUND", {
  message: "Note not found",
});

/**
 * One `{ message }` per field: the shape shadcn's `FieldError` reads, so an app can
 * feed the payload straight into a form's error map without touching the component.
 * A schema rather than a type because oRPC checks it against the thrown `data` in
 * context.ts.
 */
export const InputValidationData = z.object({
  formErrors: z.array(z.object({ message: z.string() })),
  fieldErrors: z.record(z.string(), z.array(z.object({ message: z.string() }))),
});
export type InputValidationDataOutput = z.infer<typeof InputValidationData>;

/** Raised by the `errorHandler` middleware in context.ts; same rules as above. */
export const INPUT_VALIDATION_FAILED = error("INPUT_VALIDATION_FAILED", {
  message: "Input validation failed",
  data: InputValidationData,
});
