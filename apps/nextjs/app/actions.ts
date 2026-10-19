"use server";

import type {
  NoteInput,
  NoteParamInput,
  NoteUpdateInput,
} from "@acme/core/schemas/notes";
import { safeCall } from "@acme/api/server";

import { getRpcServer } from "~/rpc/server";

/**
 * Server actions, the Next app's counterpart to the TanStack server functions:
 * both call the procedures in-process. Mutations ride back through `safeCall`
 * because a thrown action error is redacted to a digest in production, losing the
 * code and the field issues.
 */
export async function listNotes() {
  return getRpcServer().notes.list();
}

export async function getNote(input: NoteParamInput) {
  return getRpcServer().notes.get(input);
}

export async function createNote(input: NoteInput) {
  return safeCall(getRpcServer().notes.create(input));
}

export async function updateNote(input: NoteUpdateInput) {
  return safeCall(getRpcServer().notes.update(input));
}

export async function deleteNote(input: NoteParamInput) {
  return safeCall(getRpcServer().notes.remove(input));
}

// The page's first value for the same procedure the browser then refetches
// through `rpcClient` in `app/components.tsx`.
export async function serverTime() {
  return getRpcServer().time();
}
