"use client";

/**
 * "Login required" popup — shown when a signed-out visitor taps a booking
 * action (e.g. Check Slot). Explains the next step in one short sentence and
 * offers Login (with a return path back to the very action) plus a cancel.
 *
 * Accessible and smooth: role="dialog", Escape + backdrop close, focus moved
 * to the primary action, body scroll locked, fade/scale in and out, and no
 * layout shift (fixed overlay, nothing in the document flow).
 */
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { LockKeyhole } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export function LoginRequiredDialog({
  open,
  onClose,
  signInHref,
  title,
  body,
}: {
  open: boolean;
  onClose: () => void;
  /** Sign-in link that returns to the interrupted action. */
  signInHref: string;
  title?: string;
  body?: string;
}) {
  const t = useTranslations("booking");
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 140);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () =>
        document.getElementById("login-required-cta")?.focus(),
      40
    );
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label={t("dialogClose")}
        onClick={requestClose}
        className={cn(
          "absolute inset-0 bg-black/45 transition-opacity duration-150",
          closing ? "opacity-0" : "opacity-100"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        className={cn(
          "relative w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl ring-1 ring-gp-olive/10 transition-all duration-150 ease-out sm:p-6",
          closing ? "translate-y-2 scale-[0.98] opacity-0" : "translate-y-0 scale-100 opacity-100"
        )}
      >
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <h2
          id="login-required-title"
          className="font-heading mt-3 text-lg font-semibold"
        >
          {title ?? t("loginDialogTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {body ?? t("loginDialogBody")}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse sm:justify-start">
          <ButtonLink
            href={signInHref}
            id="login-required-cta"
            size="lg"
            className="h-11 w-full justify-center rounded-full px-5 font-semibold sm:w-auto"
          >
            {t("loginDialogCta")}
          </ButtonLink>
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-gp-olive/25 px-5 text-sm font-semibold text-gp-olive transition-colors hover:bg-gp-olive/5 sm:w-auto"
          >
            {t("loginDialogCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
