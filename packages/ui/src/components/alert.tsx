import type { ComponentProps } from "react";

import { cn } from "../utils";

export type AlertProps = ComponentProps<"div">;

export function Alert({ className, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md bg-red-50 px-3 py-2 text-sm/6 text-red-700",
        className,
      )}
      {...props}
    />
  );
}
