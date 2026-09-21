"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Landmark, Percent, QrCode, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export const PAYMENT_METHODS = [
  { id: "qris", icon: QrCode, labelKey: "paymentQris", descKey: "payQrisDesc" },
  {
    id: "va",
    icon: Landmark,
    labelKey: "paymentVa",
    descKey: "payVaDesc",
  },
  {
    id: "ewallet",
    icon: Wallet,
    labelKey: "paymentEwallet",
    descKey: "payEwalletDesc",
  },
  {
    id: "card",
    icon: CreditCard,
    labelKey: "paymentCard",
    descKey: "payCardDesc",
  },
  {
    id: "installment",
    icon: Percent,
    labelKey: "paymentInstallment",
    descKey: "payInstallmentDesc",
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

/**
 * Payment method picker (informational): the actual transaction is processed
 * on the official AYO channel or at the venue (PRD Fase 2).
 */
export function PaymentSelect({
  value,
  onChange,
}: {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
}) {
  const tPricing = useTranslations("pricing");
  const tCheckout = useTranslations("checkout");

  return (
    <fieldset>
      <legend className="font-heading text-lg font-semibold">
        {tCheckout("paymentSectionTitle")}
      </legend>
      <p className="mt-1 text-xs text-muted-foreground">
        {tCheckout("paymentSectionNote")}
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const selected = value === method.id;
          return (
            <label
              key={method.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                selected
                  ? "border-gp-rust bg-gp-rust/5"
                  : "border-gp-olive/15 bg-background hover:border-gp-olive/35",
                method.id === "installment" && "sm:col-span-2"
              )}
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selected}
                onChange={() => onChange(method.id)}
                className="sr-only"
              />
              <span
                className={cn(
                  "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full",
                  selected
                    ? "bg-gp-rust text-gp-light"
                    : "bg-gp-olive/5 text-gp-olive"
                )}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-semibold",
                    selected ? "text-gp-rust" : "text-gp-olive"
                  )}
                >
                  {tPricing(method.labelKey)}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {tCheckout(method.descKey)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
