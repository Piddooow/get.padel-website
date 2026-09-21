import { getLocale, getTranslations } from "next-intl/server";
import {
  Calendar,
  GraduationCap,
  Map,
  Shield,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { pick } from "@/data/localized";
import { helpTopics, type HelpTopicIcon } from "@/data/help";
import { site, whatsappLink } from "@/data/site";

const ICONS: Record<HelpTopicIcon, LucideIcon> = {
  calendar: Calendar,
  tag: Tag,
  map: Map,
  shield: Shield,
  graduation: GraduationCap,
  sparkles: Sparkles,
};

/** Quick help topics — routes visitors to the page or channel with answers. */
export async function HelpTopics() {
  const t = await getTranslations("help");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();

  return (
    <section aria-labelledby="help-topics-title">
      <h2
        id="help-topics-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("topicsTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("topicsSubtitle")}
      </p>

      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {helpTopics.map((topic) => {
          const Icon = ICONS[topic.icon];
          const body = (
            <>
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-gp-olive/5 text-gp-olive">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-heading text-base font-semibold">
                {pick(locale, topic.title)}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {pick(locale, topic.description)}
              </p>
              <span className="mt-auto pt-4 text-sm font-semibold text-gp-olive underline-offset-4 group-hover:underline">
                {t("openCta")} →
              </span>
            </>
          );

          return (
            <li key={topic.id}>
              {topic.route ? (
                <Link
                  href={topic.route}
                  className="group flex h-full flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 transition-colors hover:ring-gp-olive/30 sm:p-6"
                >
                  {body}
                </Link>
              ) : (
                <a
                  href={
                    topic.channel === "email-event"
                      ? `mailto:${site.contact.emailEvent}`
                      : whatsappLink(tCommon("waMessage"))
                  }
                  className="group flex h-full flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 transition-colors hover:ring-gp-olive/30 sm:p-6"
                >
                  {body}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
