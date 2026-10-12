import type { ComponentProps } from "react";
import { mergeProps, useRender } from "@base-ui/react";

import { cn } from "../utils";

export type HeaderProps = ComponentProps<"header">;

export function Header({ className, ...props }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 isolate flex h-(--header-height) items-center overflow-hidden border-b bg-white max-sm:-mx-(--container-padding) max-sm:px-(--container-padding)",
        className,
      )}
      {...props}
    />
  );
}

export type HeaderLinksProps = ComponentProps<"div">;

export function HeaderLinks({ className, ...props }: HeaderLinksProps) {
  return (
    <div
      className={cn("flex h-full flex-1 items-center justify-end", className)}
      {...props}
    />
  );
}

export type HeaderLinkProps = useRender.ComponentProps<"a">;

export function HeaderLink({ render, ...props }: HeaderLinkProps) {
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className:
          "flex h-full items-center border-b-2 border-b-transparent px-3 text-sm/6 font-medium text-zinc-900 transition-colors hover:text-zinc-900/60 aria-[current=page]:border-orange-600",
      },
      props,
    ),
  });
}
