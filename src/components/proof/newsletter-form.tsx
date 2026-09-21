"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isValidEmail, normalizeEmail } from "@/lib/newsletter";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "pending" | "success" | "invalid" | "error";

/**
 * Newsletter sign-up (PRD Fase 4) — client validation plus the real
 * `POST /api/newsletter` endpoint (`newsletter_subscribers` table).
 */
export function NewsletterForm() {
  const t = useTranslations("proof");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("invalid");
      return;
    }

    setStatus("pending");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: normalizeEmail(email),
          locale,
          source: "proof-section",
        }),
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <p className="inline-flex items-start gap-2.5 rounded-xl border border-gp-olive/25 bg-gp-olive/5 px-4 py-3 text-sm font-medium text-gp-olive">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {t("newsletterSuccess")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">{t("newsletterLabel")}</span>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder={t("newsletterPlaceholder")}
            aria-invalid={status === "invalid"}
            aria-describedby="newsletter-status"
            className="h-11 rounded-full bg-card px-4"
          />
        </label>
        <Button
          type="submit"
          size="lg"
          disabled={status === "pending"}
          className={cn("h-11 shrink-0 rounded-full px-5 font-semibold")}
        >
          <Send className="size-4" aria-hidden="true" />
          {status === "pending" ? t("newsletterPending") : t("newsletterCta")}
        </Button>
      </div>
      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={cn(
          "mt-2 text-xs",
          status === "invalid" || status === "error"
            ? "text-gp-rust"
            : "text-muted-foreground"
        )}
      >
        {status === "invalid"
          ? t("newsletterInvalid")
          : status === "error"
            ? t("newsletterError")
            : t("newsletterNote")}
      </p>
    </form>
  );
}
