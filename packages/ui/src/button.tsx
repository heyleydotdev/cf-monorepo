import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "rounded-lg px-4 py-2 text-sm font-medium transition",
  {
    variants: {
      variant: {
        primary: "bg-zinc-900 text-white hover:bg-zinc-800",
        secondary: "border border-zinc-300 text-zinc-900 hover:bg-zinc-100",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}
