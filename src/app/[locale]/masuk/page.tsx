import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/auth/auth-form";
import { safeNextPath } from "@/lib/navigation";
import { Reveal } from "@/components/ui/reveal";
import { getSessionUser } from "@/lib/auth";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "auth" });

  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: {
      canonical: `/${resolved}/masuk`,
      languages: {
        id: "/id/masuk",
        en: "/en/masuk",
        "x-default": "/id/masuk",
      },
    },
    robots: { index: false, follow: true },
  };
}

function first(value: string | string[] | undefined): string | null {
  const resolved = Array.isArray(value) ? value[0] : value;
  return resolved ?? null;
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const sp = await searchParams;
  const nextPath = safeNextPath(first(sp.next), `/${locale}/akun`);

  // Already signed in — no reason to show the form again.
  const user = await getSessionUser();
  if (user) {
    redirect(nextPath);
  }

  const t = await getTranslations("auth");

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <Reveal>
        <header className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
            {t("eyebrow")}
          </span>
          <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10 max-w-md rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
          <AuthForm nextPath={nextPath} accountHref={`/${locale}/akun`} />
        </div>
      </Reveal>
    </section>
  );
}
