import { getTranslations } from "next-intl/server";
import {
  FaqAccordion,
  type FaqAccordionItem,
} from "@/components/help/faq-accordion";

/** FAQ section for the Location page (shared accordion). */
export async function LocationFaq({ items }: { items: FaqAccordionItem[] }) {
  const t = await getTranslations("location");

  return (
    <section aria-labelledby="location-faq-title">
      <h2
        id="location-faq-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("faqTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t("faqSubtitle")}</p>

      <div className="mt-6">
        <FaqAccordion items={items} />
      </div>
    </section>
  );
}
