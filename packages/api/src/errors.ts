import { error } from "@orpc/server";

/**
 * A code `errorStatusMap` in router.ts has to know, or it maps to 500. Declared as
 * a factory so a caller can narrow with `instanceof`.
 */
export const NOTE_NOT_FOUND = error("NOTE_NOT_FOUND", {
  message: "Note not found",
});

/** Raised by `shapeInputErrors` in context.ts; same rules as above. */
export const INPUT_VALIDATION_FAILED = error("INPUT_VALIDATION_FAILED", {
  message: "Input validation failed",
});
