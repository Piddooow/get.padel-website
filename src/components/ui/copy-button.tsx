"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copy-to-clipboard button with a light animated confirmation.
 *
 * On press: the value lands in the clipboard, the icon morphs to a check and
 * the label switches to "Berhasil disalin" for a moment, then everything
 * returns to rest. No popup, no layout shift (the label width is reserved),
 * and it disables itself while confirming so double taps can't stack.
 */
export function CopyButton({
  value,
  label,
  className,
  labelClassName,
}: {
  /** Text written to the clipboard. */
  value: string;
  /** Resting label, e.g. "Salin". */
  label?: string;
  className?: string;
  labelClassName?: string;
}) {
  const t = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  const restingLabel = label ?? t("copy");
  const copiedLabel = t("copied");

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={copied}
      aria-label={copied ? copiedLabel : restingLabel}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors disabled:opacity-100",
        copied
          ? "border-emerald-600/40 bg-emerald-600/10 text-emerald-700"
          : "border-gp-olive/25 text-gp-olive hover:bg-gp-olive/5",
        className
      )}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex size-3.5 shrink-0 items-center justify-center"
      >
        <Copy
          className={cn(
            "absolute size-3.5 transition-all duration-200 ease-out",
            copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
          )}
        />
        <Check
          className={cn(
            "absolute size-3.5 transition-all duration-200 ease-out",
            copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
          )}
        />
      </span>
      {/* Both labels occupy the same grid cell: swapping never shifts layout. */}
      <span
        className={cn(
          "grid text-left [&>span]:col-start-1 [&>span]:row-start-1",
          labelClassName
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "transition-opacity duration-200",
            copied ? "opacity-0" : "opacity-100"
          )}
        >
          {restingLabel}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "whitespace-nowrap transition-opacity duration-200",
            copied ? "opacity-100" : "opacity-0"
          )}
        >
          {copiedLabel}
        </span>
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? copiedLabel : ""}
      </span>
    </button>
  );
}
