"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { whatsappLink } from "@/data/site";

const PHONE_RE = /^(\+?62|0)8\d{7,12}$/;

/**
 * Resend request form — confirmations are owned by the AYO booking system,
 * so the request is forwarded to the venue's official CS on WhatsApp.
 */
export function ResendForm() {
  const t = useTranslations("confirmation");
  const tCheckout = useTranslations("checkout");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookingId, setBookingId] = useState("");

  const normalizedPhone = phone.replace(/[\s().-]/g, "");
  const valid = name.trim().length >= 2 && PHONE_RE.test(normalizedPhone);

  const href = whatsappLink(
    valid
      ? t("resendTemplate", {
          name: name.trim(),
          phone: normalizedPhone,
          bookingId: bookingId.trim() || "-",
        })
      : tCheckout("ctaWa")
  );

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{t("formTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("formNote")}</p>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="resend-name"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {tCheckout("nameLabel")}
          </label>
          <Input
            id="resend-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={tCheckout("namePlaceholder")}
            autoComplete="name"
            className="h-11 bg-background"
          />
        </div>
        <div>
          <label
            htmlFor="resend-phone"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {tCheckout("phoneLabel")}
          </label>
          <Input
            id="resend-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={tCheckout("phonePlaceholder")}
            autoComplete="tel"
            className="h-11 bg-background"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="resend-booking"
            className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {t("bookingIdLabel")}
          </label>
          <Input
            id="resend-booking"
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            placeholder={t("bookingIdPlaceholder")}
            className="h-11 bg-background"
          />
        </div>
      </div>

      {!valid && (
        <p className="mt-3 text-xs text-muted-foreground">
          {t("resendRequired")}
        </p>
      )}

      <div className="mt-5">
        {valid ? (
          <ButtonLink
            href={href}
            external
            size="lg"
            className="w-full rounded-full px-6 font-semibold sm:w-auto"
          >
            <Send className="size-4" aria-hidden="true" />
            {t("resendCta")}
          </ButtonLink>
        ) : (
          <Button
            type="button"
            disabled
            aria-disabled="true"
            size="lg"
            className="w-full rounded-full px-6 font-semibold opacity-60 sm:w-auto"
          >
            <Send className="size-4" aria-hidden="true" />
            {t("resendCta")}
          </Button>
        )}
      </div>

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <WhatsAppIcon className="size-3.5" aria-hidden="true" />
        {t("waBody")}
      </p>
    </div>
  );
}
