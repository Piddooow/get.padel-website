"use client";

/**
 * Navbar profile control.
 *
 * Signed out: a 36px "Profil" pill (icon) that links to the sign-in page —
 * it also reserves the slot so nothing shifts when the session arrives.
 * Signed in: the same 36px circle shows the user's initials and links to
 * their bookings. The width never changes the navbar height.
 */
import { useLocale, useTranslations } from "next-intl";
import { UserRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { UserAvatar } from "@/components/auth/user-avatar";
import { useSession } from "@/lib/session-client";
import { cn } from "@/lib/utils";

export function HeaderProfile() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const signInHref = `/${locale}/masuk`;
  const { user, loaded } = useSession();

  const pill =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-gp-light/25 text-gp-light/85 transition-colors hover:border-gp-light/40 hover:bg-white/10 hover:text-gp-light focus-visible:ring-2 focus-visible:ring-gp-light/60 focus-visible:outline-none";

  if (loaded && user) {
    return (
      <Link
        href="/akun"
        aria-label={t("myBooking")}
        title={user.name}
        className={cn(pill, "border-transparent bg-gp-light/15 hover:bg-gp-light/25")}
      >
        <UserAvatar name={user.name} className="text-gp-light" />
      </Link>
    );
  }

  return (
    <Link href={signInHref} aria-label={t("profile")} className={pill}>
      <UserRound className="size-4" aria-hidden="true" />
    </Link>
  );
}
