import { cn } from "@/lib/utils";

/** Initials from a display name (max two letters). */
export function initialsOf(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GP"
  );
}

/**
 * Circular user avatar with an initials fallback (no photo field exists yet).
 * The size is fixed so it stays identical on every page and never shifts the
 * navbar layout.
 */
export function UserAvatar({
  name,
  className,
  size = "md",
}: {
  name: string;
  className?: string;
  /** "md" = 36px (navbar + pages), "sm" = 24px (inline). */
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-heading inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none",
        size === "md" ? "size-9 text-xs" : "size-6 text-[10px]",
        className
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
