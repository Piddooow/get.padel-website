import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Article cover: the post photo (with the tag label) when one exists, falling
 * back to the designed palette gradient so a missing photo is still on-brand.
 */
export function ArticleCover({
  tag,
  src,
  className,
  size = "card",
}: {
  tag: string;
  /** Local cover photo; falls back to the gradient artwork when absent. */
  src?: string | null;
  className?: string;
  /** "card" for list cards, "hero" for the article page header. */
  size?: "card" | "hero";
}) {
  const tagStyles = cn(
    "inline-flex items-center rounded-full border border-gp-light/25 bg-black/25 font-semibold tracking-wide text-gp-light uppercase backdrop-blur-sm",
    size === "card" ? "px-3 py-1 text-[11px]" : "px-3.5 py-1.5 text-xs"
  );

  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent"
        />
        <span
          className={cn(
            tagStyles,
            "absolute",
            size === "hero" ? "bottom-5 left-5" : "bottom-3 left-3"
          )}
        >
          {tag}
        </span>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative flex items-end overflow-hidden bg-gradient-to-br from-gp-olive via-gp-olive to-[#4a5a3a]",
        size === "card" ? "p-4" : "p-6",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-full border border-gp-light/20",
          size === "hero"
            ? "-top-16 -right-10 size-52"
            : "-top-10 -right-6 size-32"
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute rounded-full border border-gp-rust/40",
          size === "hero"
            ? "-top-24 right-16 size-36"
            : "-top-14 right-10 size-20"
        )}
      />
      <span className={cn("relative", tagStyles)}>{tag}</span>
    </div>
  );
}
