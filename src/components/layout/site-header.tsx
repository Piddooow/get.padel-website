"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { SterlingGateKineticNavigation } from "@/components/ui/sterling-gate-kinetic-navigation";
import { usePathname } from "@/i18n/navigation";
import { navItems } from "@/data/nav";
import { site, whatsappLink } from "@/data/site";
import { cn } from "@/lib/utils";

// Same custom ease as the kinetic menu (reference: CustomEase "main").
if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
  try {
    if (!gsap.parseEase("main")) {
      CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
    }
  } catch {
    // Fall back to the default ease if CustomEase is unavailable.
  }
}

export function SiteHeader() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const buttonMountedRef = useRef(false);

  // Reference behaviour: the button texts slide up (stagger 0.2) and the
  // plus icon rotates 315° while the menu opens — reversed on close.
  useEffect(() => {
    if (!buttonMountedRef.current) {
      buttonMountedRef.current = true;
      return;
    }
    const button = menuButtonRef.current;
    if (!button) return;

    const texts = button.querySelectorAll(".menu-button-text p");
    const icon = button.querySelector(".menu-button-icon");
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduced) {
      gsap.set(texts, { yPercent: menuOpen ? -100 : 0 });
      gsap.set(icon, { rotate: menuOpen ? 315 : 0 });
      return;
    }

    if (menuOpen) {
      gsap.fromTo(
        texts,
        { yPercent: 0 },
        { yPercent: -100, stagger: 0.2, duration: 0.7, ease: "main" }
      );
      // Plain `to` so a hovered icon (already at 315°) keeps spinning forward
      // instead of snapping back through 0 — same result as the reference
      // when the menu is opened without hovering.
      gsap.to(icon, { rotate: 315, duration: 0.7, ease: "main" });
    } else {
      gsap.to(texts, { yPercent: 0, duration: 0.7, ease: "main" });
      gsap.to(icon, { rotate: 0, duration: 0.7, ease: "main" });
    }
  }, [menuOpen]);

  // Reference hover animation: the plus spins 315° on hover and returns
  // to 0° on leave (paused while the menu is open).
  useEffect(() => {
    const button = menuButtonRef.current;
    if (!button || menuOpen) return;

    const icon = button.querySelector(".menu-button-icon");
    if (!icon) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onEnter = () => {
      gsap.to(icon, { rotate: 315, duration: 0.7, ease: "main" });
    };
    const onLeave = () => {
      gsap.to(icon, { rotate: 0, duration: 0.7, ease: "main" });
    };

    button.addEventListener("mouseenter", onEnter);
    button.addEventListener("mouseleave", onLeave);
    return () => {
      button.removeEventListener("mouseenter", onEnter);
      button.removeEventListener("mouseleave", onLeave);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const homeHref = `/${locale}`;
  const hrefFor = (item: (typeof navItems)[number]) =>
    item.route
      ? `/${locale}${item.route}`
      : item.hash
        ? `${homeHref}#${item.hash}`
        : homeHref;
  // Only real pages own the persistent pill; hash items (Contact) must never
  // "stay" active — they play a press animation and scroll to their section.
  const isActive = (item: (typeof navItems)[number]) =>
    item.route ? pathname === item.route : !item.hash && isHome;

  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const handleNavPress = (key: string) => {
    setPressedKey(key);
    window.setTimeout(
      () => setPressedKey((current) => (current === key ? null : current)),
      500
    );
  };

  const waHref = whatsappLink(t("common.waMessage"));
  const bookHref = site.links.ayo;

  const closeMenu = () => {
    setMenuOpen(false);
    // Return focus to the trigger for keyboard users.
    window.setTimeout(() => menuButtonRef.current?.focus(), 0);
  };

  return (
    <>
      <header
        className={cn(
          "site-header sticky top-0 z-50 bg-gp-olive text-gp-light transition-shadow duration-300",
          scrolled && "shadow-md shadow-gp-olive/25"
        )}
      >
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-20 lg:px-8">
          {/* Logo */}
          <a
            href={homeHref}
            aria-label={t("common.brand")}
            className="shrink-0 rounded-md focus-visible:ring-2 focus-visible:ring-gp-light/60 focus-visible:outline-none"
          >
            <Image
              src="/logo-getpadel.webp"
              alt={t("common.brand")}
              width={1000}
              height={585}
              priority
              className="h-12 w-auto lg:h-14"
            />
          </a>

          {/* Desktop nav (from lg — the fullscreen menu covers smaller widths) */}
          <nav
            className="hidden items-center gap-1 lg:flex"
            aria-label={t("nav.label")}
          >
            {navItems.map((item) => (
              <a
                key={item.key}
                href={hrefFor(item)}
                aria-current={isActive(item) ? "page" : undefined}
                onClick={() => handleNavPress(item.key)}
                className={cn(
                  // Same pill language as the switcher/CTA: full radius + a
                  // border that appears on hover/focus. Only real pages keep
                  // the active border; pressed items flash a soft animation.
                  "inline-flex h-11 items-center rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-gp-light/60 focus-visible:outline-none xl:px-4",
                  isActive(item)
                    ? "border-gp-light/25 bg-white/10 text-gp-light"
                    : "border-transparent text-gp-light/80 hover:border-gp-light/20 hover:bg-white/10 hover:text-gp-light",
                  pressedKey === item.key && "animate-gp-nav-press"
                )}
              >
                {t(`nav.${item.key}`)}
              </a>
            ))}
          </nav>

          {/* Right cluster (reference nav-row__right) */}
          <div className="nav-row__right">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("common.whatsapp")}
              className="hidden size-11 shrink-0 items-center justify-center rounded-full border border-gp-light/25 text-gp-light/85 transition-colors hover:border-gp-light/40 hover:bg-white/10 hover:text-gp-light focus-visible:ring-2 focus-visible:ring-gp-light/60 focus-visible:outline-none xl:inline-flex"
            >
              <WhatsAppIcon className="size-4" />
            </a>
            <LanguageSwitcher className="inline-flex" />
            <ButtonLink
              href={bookHref}
              external
              size="lg"
              className="hidden rounded-full px-5 font-semibold xl:inline-flex"
            >
              {t("common.bookNow")}
            </ButtonLink>

            {/* Reference menu button: Menu/Close swap + rotating plus */}
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              aria-label={menuOpen ? t("nav.closeMenu") : t("nav.menu")}
              onClick={() => setMenuOpen((value) => !value)}
              className="nav-close-btn shrink-0 transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-gp-light/60 focus-visible:outline-none"
            >
              <span className="menu-button-text" aria-hidden="true">
                <p className="p-large">{t("menu.buttonMenu")}</p>
                <p className="p-large">{t("menu.buttonClose")}</p>
              </span>
              <span className="icon-wrap" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="menu-button-icon"
                >
                  <path
                    d="M7.33333 16L7.33333 -3.2055e-07L8.66667 -3.78832e-07L8.66667 16L7.33333 16Z"
                    fill="currentColor"
                  />
                  <path
                    d="M16 8.66667L-2.62269e-07 8.66667L-3.78832e-07 7.33333L16 7.33333L16 8.66667Z"
                    fill="currentColor"
                  />
                  <path
                    d="M6 7.33333L7.33333 7.33333L7.33333 6C7.33333 6.73637 6.73638 7.33333 6 7.33333Z"
                    fill="currentColor"
                  />
                  <path
                    d="M10 7.33333L8.66667 7.33333L8.66667 6C8.66667 6.73638 9.26362 7.33333 10 7.33333Z"
                    fill="currentColor"
                  />
                  <path
                    d="M6 8.66667L7.33333 8.66667L7.33333 10C7.33333 9.26362 6.73638 8.66667 6 8.66667Z"
                    fill="currentColor"
                  />
                  <path
                    d="M10 8.66667L8.66667 8.66667L8.66667 10C8.66667 9.26362 9.26362 8.66667 10 8.66667Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </header>

      <SterlingGateKineticNavigation open={menuOpen} onClose={closeMenu} />
    </>
  );
}
