import { getTranslations } from "next-intl/server";
import { PolicyCard } from "@/components/help/policy-card";

/** Kebijakan reschedule & refund — fakta yang sama dengan halaman bantuan. */
export async function PolicySection() {
  const t = await getTranslations("programs");

  return (
    <section aria-labelledby="policy-title">
      <h2
        id="policy-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("sectionPolicyTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("sectionPolicySubtitle")}
      </p>

      <div className="mt-6">
        <PolicyCard />
      </div>
    </section>
  );
}
