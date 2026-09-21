import { getTranslations } from "next-intl/server";
import {
  CalendarCheck,
  CreditCard,
  Crown,
  Landmark,
  MailCheck,
  Percent,
  QrCode,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";

/** Booking flow + payment info (PRD Fase 2: Pesan & Bayar Lapangan). */
export async function BookingSteps() {
  const t = await getTranslations("pricing");

  const steps = [
    {
      icon: <CalendarCheck className="size-4" aria-hidden="true" />,
      title: t("step1Title"),
      body: t("step1Body"),
    },
    {
      icon: <Smartphone className="size-4" aria-hidden="true" />,
      title: t("step2Title"),
      body: t("step2Body"),
    },
    {
      icon: <MailCheck className="size-4" aria-hidden="true" />,
      title: t("step3Title"),
      body: t("step3Body"),
    },
  ];

  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-gp-rust/10 text-gp-rust">
            {step.icon}
          </span>
          <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-1 font-heading font-semibold">{step.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

/** Informational overview of accepted payment methods. */
export async function PaymentsCard() {
  const t = await getTranslations("pricing");

  const methods = [
    { icon: <QrCode className="size-4" aria-hidden="true" />, label: t("paymentQris") },
    { icon: <Landmark className="size-4" aria-hidden="true" />, label: t("paymentVa") },
    { icon: <Wallet className="size-4" aria-hidden="true" />, label: t("paymentEwallet") },
    { icon: <CreditCard className="size-4" aria-hidden="true" />, label: t("paymentCard") },
    { icon: <Percent className="size-4" aria-hidden="true" />, label: t("paymentInstallment") },
  ];

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
      <h3 className="font-heading text-lg font-semibold">
        {t("paymentTitle")}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("paymentSubtitle")}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {methods.map((method) => (
          <li
            key={method.label}
            className="inline-flex items-center gap-2 rounded-full border border-gp-olive/20 px-3.5 py-2 text-sm font-medium text-gp-olive"
          >
            <span className="text-gp-rust">{method.icon}</span>
            {method.label}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("paymentInstallmentNote")}
      </p>
    </div>
  );
}

/** Membership note + refund/reschedule summary shown before paying. */
export async function MemberRefundCards() {
  const t = await getTranslations("pricing");

  return (
    <div className="flex flex-col gap-6">
      {/* Membership */}
      <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Crown className="size-4 text-gp-rust" aria-hidden="true" />
          {t("memberTitle")}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {t("memberBody")}
        </p>
        <ButtonLink
          href={site.links.ayo}
          external
          variant="outline"
          size="sm"
          className="mt-4 rounded-full border-gp-olive/25 font-semibold text-gp-olive hover:bg-gp-olive/5"
        >
          {t("memberCta")}
        </ButtonLink>
      </div>

      {/* Cancellation & reschedule policy — shown before paying */}
      <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <ShieldCheck className="size-4 text-gp-rust" aria-hidden="true" />
          {t("refundTitle")}
        </h3>
        <dl className="mt-3 space-y-3 text-sm">
          <PolicyRow
            label={t("refundRowRescheduleLabel")}
            value={t("refundRowRescheduleValue")}
          />
          <PolicyRow
            label={t("refundRowCancelLabel")}
            value={t("refundRowCancelValue")}
          />
          <PolicyRow
            label={t("refundRowRefundLabel")}
            value={t("refundRowRefundValue")}
          />
          <PolicyRow
            label={t("refundRowMemberLabel")}
            value={t("refundRowMemberValue")}
          />
          <PolicyRow
            label={t("refundRowTechnicalLabel")}
            value={t("refundRowTechnicalValue")}
          />
          <PolicyRow
            label={t("refundRowPracticeLabel")}
            value={t("refundRowPracticeValue")}
          />
        </dl>
      </div>
    </div>
  );
}

/** Full payments section (methods + member + refund) — used on /harga. */
export async function PaymentInfo() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <PaymentsCard />
      <MemberRefundCards />
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-gp-olive/10 pb-3 last:border-b-0 last:pb-0">
      <dt className="font-medium text-gp-olive">{label}</dt>
      <dd className="mt-0.5 text-muted-foreground">{value}</dd>
    </div>
  );
}
