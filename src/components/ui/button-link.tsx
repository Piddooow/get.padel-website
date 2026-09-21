"use client";

import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

interface ButtonLinkProps extends Omit<ButtonProps, "render" | "nativeButton"> {
  href: string;
  /** Opens in a new tab with `rel="noopener noreferrer"`. */
  external?: boolean;
}

/**
 * Button rendered as an anchor. Base UI requires `nativeButton={false}` when
 * the rendered element is not a real <button>; this wrapper encodes that
 * once so call sites stay simple and accessible.
 */
export function ButtonLink({
  href,
  external = false,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Button
      nativeButton={false}
      render={
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        />
      }
      {...props}
    >
      {children}
    </Button>
  );
}
