"use client";

import { Home, CalendarDays, Tag, MapPin, GraduationCap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { LimelightNav, type NavItem } from "@/components/ui/limelight-nav";
import { usePathname } from "@/i18n/navigation";

/**
 * Floating quick navigation (limelight dock): Home / Schedule / Pricing /
 * Location / Programs. Bottom-centre, responsive, hidden on the admin page.
 */
export function QuickNavDock() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  // Every item uses identical markup and geometry — same padding, same icon
  // size, no per-icon transforms — so the Home button sits exactly like every
  // other dock item in every state.
  const items: NavItem[] = [
    { id: "home", icon: <Home />, label: t("home"), href: `/${locale}` },
    {
      id: "schedule",
      icon: <CalendarDays />,
      label: t("schedule"),
      href: `/${locale}/jadwal`,
    },
    {
      id: "pricing",
      icon: <Tag />,
      label: t("pricing"),
      href: `/${locale}/harga`,
    },
    {
      id: "location",
      icon: <MapPin />,
      label: t("location"),
      href: `/${locale}/lokasi`,
    },
    {
      id: "program",
      icon: <GraduationCap />,
      label: t("program"),
      href: `/${locale}/program`,
    },
  ];

  const routes: Record<string, string> = {
    "home": "/",
    "schedule": "/jadwal",
    "pricing": "/harga",
    "location": "/lokasi",
    "program": "/program",
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
