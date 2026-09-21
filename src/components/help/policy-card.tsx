import { getTranslations } from "next-intl/server";
import { Info } from "lucide-react";

/**
 * Shared reschedule & refund policy card — one source of truth for the facts
 * shown on the Program page and the Help page (rows come from the `pricing`
 * namespace so every page keeps the exact same wording).
 */
export async function PolicyCard() {
  const tPrograms = await getTranslations("programs");
  const tPricing = await getTranslations("pricing");

  const rows = [
    {
      label: tPricing("refundRowRescheduleLabel"),
      value: tPricing("refundRowRescheduleValue"),
    },
    {
      label: tPricing("refundRowCancelLabel"),
      value: tPricing("refundRowCancelValue"),
    },
    {
      label: tPricing("refundRowRefundLabel"),
      value: tPricing("refundRowRefundValue"),
    },
    {
      label: tPricing("refundRowMemberLabel"),
      value: tPricing("refundRowMemberValue"),
    },
    {
      label: tPricing("refundRowTechnicalLabel"),
      value: tPricing("refundRowTechnicalValue"),
    },
    {
      label: tPricing("refundRowPracticeLabel"),
      value: tPricing("refundRowPracticeValue"),
    },
  ];

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
      {/* Key rule callout — the no-refund policy gets its own emphasis */}
      <p className="flex items-start gap-2.5 rounded-xl border border-gp-rust/30 bg-gp-rust/5 px-4 py-3 text-sm font-medium text-gp-rust">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {tPrograms("policyAlert")}
      </p>

      <dl className="mt-5 space-y-3 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="border-b border-gp-olive/10 pb-3 last:border-b-0 last:pb-0"
          >
            <dt className="font-medium text-gp-olive">{row.label}</dt>
            <dd className="mt-0.5 text-muted-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
