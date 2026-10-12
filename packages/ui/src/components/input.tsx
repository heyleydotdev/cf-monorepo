import type { ComponentProps } from "react";

import { cn } from "../utils";

export type InputProps = ComponentProps<"input">;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "outline-border w-full rounded-md border-0 bg-white px-2.5 py-1 text-sm/6 text-zinc-900 outline-1 transition placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-orange-500 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "outline-border min-h-24 w-full resize-y rounded-md border-0 bg-white px-2.5 py-1 text-sm/6 text-zinc-900 outline-1 transition placeholder:text-zinc-400 focus-visible:outline-2 focus-visible:outline-orange-500 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
