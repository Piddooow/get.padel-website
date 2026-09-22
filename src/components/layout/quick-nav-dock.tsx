"use client";

import { Home, CalendarDays, CircleHelp, CupSoda } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";
import { usePathname } from "@/i18n/navigation";

/**
 * Floating quick navigation (limelight dock): Home / Schedule /
 * @racerallycoffee / Help. The calendar button opens the Schedule page (the
 * informational court and slot guide) instead of jumping straight to AYO.
 * Bottom-centre and responsive.
 */
export function QuickNavDock() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  // Every item uses identical markup and geometry (same padding, same icon
  // size, no per-icon transforms) so the Home button sits exactly like every
  // other dock item in every state. Order per the blueprint:
  // Home → Schedule → @racerallycoffee → Help.
  const items: NavItem[] = [
    {
      id: "home",
      icon: <Home />,
      label: t("home"),
      href: `/${locale}`,
    },
    {
      id: "schedule",
      icon: <CalendarDays />,
      label: t("schedule"),
      href: `/${locale}/schedule`,
    },
    {
      id: "race-rally",
      icon: <CupSoda />,
      label: t("raceRally"),
      href: `/${locale}/racerallycoffee`,
    },
    {
      id: "help",
      icon: <CircleHelp />,
      label: t("help"),
      href: `/${locale}/bantuan`,
    },
  ];

  const routes: Record<string, string> = {
    home: "/",
    schedule: "/schedule",
    "race-rally": "/racerallycoffee",
    help: "/bantuan",
  };
  const activeIndex = items.findIndex(
    (item) => routes[String(item.id)] === pathname
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-4 lg:bottom-6">
      <LimelightNav
        items={items}
        activeIndex={activeIndex}
        aria-label={t("label")}
        className="pointer-events-auto"
      />
    </div>
  );
}
