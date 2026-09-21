"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { notifyAuthChanged } from "@/lib/session-client";

/** Signs out (revokes the session) and returns to the homepage. */
export function LogoutButton({ homeHref }: { homeHref: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          notifyAuthChanged();
          router.push(homeHref);
          router.refresh();
        }
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-full border border-gp-olive/20 px-3.5 text-xs font-semibold text-gp-olive transition-colors hover:border-gp-olive/40 disabled:opacity-60"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      {t("logoutCta")}
    </button>
  );
}
