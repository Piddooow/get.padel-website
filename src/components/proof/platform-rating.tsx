import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type RatingPlatformKey = "google" | "ayo";

/**
 * One rating platform (Google Maps / Ayo.co.id): stars, score, review count
 * and a link to read the reviews at the source.
 */
export function PlatformRating({
  className,
  score,
  countLabel,
  label,
  href,
}: {
  className?: string;
  /** Pre-formatted score, e.g. "5,0" / "5.0". */
  score: string;
  /** Pre-formatted count line, e.g. "52 ulasan" / "52 reviews". */
  countLabel: string;
  /** Platform name shown on the card. */
  label: string;
  /** Public link to the platform reviews. */
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col rounded-xl border border-gp-olive/20 bg-card px-3.5 py-3 transition-colors hover:border-gp-olive/40 hover:bg-gp-olive/5",
        className
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="mt-1.5 flex items-baseline gap-2">
        <span className="font-heading text-xl font-bold tabular-nums text-gp-olive">
          {score}
        </span>
        <span
          className="flex items-center gap-0.5 text-gp-rust"
          role="img"
          aria-label={countLabel}
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="size-3 fill-current" aria-hidden="true" />
          ))}
        </span>
      </span>
      <span className="mt-1 text-[11px] text-muted-foreground">
        {countLabel}
      </span>
    </a>
  );
}
