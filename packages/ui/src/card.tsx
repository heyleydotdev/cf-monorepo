import type { ComponentProps } from "react";

import { cn } from "./utils";

export type CardProps = ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-6",
        className,
      )}
      {...props}
    />
  );
}
