import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";

import { cn } from "../utils";

const buttonVariants = cva(
  "ring-border rounded-lg px-3 text-sm/6 font-medium shadow-xs ring-1 transition-colors ring-inset disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-orange-500 hover:bg-orange-400",
        ghost: "ring-border/50 hover:bg-zinc-900/10",
        ghostDestructive:
          "ring-border/50 hover:bg-red-500/10 hover:text-red-500",
      },
      size: {
        base: "h-8",
        xs: "h-7 px-2.5 text-xs/6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "base",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
