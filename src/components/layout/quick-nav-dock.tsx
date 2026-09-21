"use client";

import { Home, CalendarDays, CalendarCheck, UserRound } from "lucide-react";
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
  // Order per the mobile spec: Schedule → My Booking → Home → Profile
  // (Home sits in the middle of the row). Profile funnels through /masuk,
  // which immediately forwards signed-in visitors to their account page.
  // Order per the latest mobile spec: Home → Schedule → My Booking → Profile.
  // Profile funnels through /masuk, which forwards signed-in visitors to /akun.
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
      href: `/${locale}/jadwal`,
    },
    {
      id: "my-booking",
      icon: <CalendarCheck />,
      label: t("myBooking"),
      href: `/${locale}/akun`,
    },
    {
      id: "profile",
      icon: <UserRound />,
      label: t("profile"),
      href: `/${locale}/masuk`,
    },
  ];

  const routes: Record<string, string> = {
    "schedule": "/jadwal",
    "my-booking": "/akun",
    "home": "/",
    "profile": "/masuk",
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
