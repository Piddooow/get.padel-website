"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { routing } from "@/i18n/routing";
import {
  afterCover,
  beginTransition,
  ensureOverlay,
  getTransitionReason,
  isTransitionBusy,
  playCurtainIn,
  prefersReducedMotion,
  revealTransition,
} from "@/lib/page-transition-overlay";

/** Module scope so a dev double-mount cannot cancel the refresh restore. */
let refreshTimer: number | null = null;

const LOCALE_PREFIX = new RegExp(`^/(?:${routing.locales.join("|")})(?=/|$)`);

/** Path without its locale prefix — used to detect locale-only switches. */
function stripLocale(path: string): string {
  return path.replace(LOCALE_PREFIX, "") || "/";
}

/**
 * Smooth page transition: internal link clicks sweep the olive curtain (the
 * same animation as the kinetic menu), then the new page is revealed with the
 * mirrored sweep. The curtain is a DOM node outside React so it also survives
 * the locale-layout remount on language switches — every navigation feels
 * identical. Skipped for `prefers-reduced-motion` users.
 */
export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();

  // Intercept internal navigations.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a");
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      // Only same-origin route links (no external URLs, mailto, tel).
      if (!href.startsWith("/")) return;

      const [targetPath, targetHash = ""] = href.split("#");
      const currentPath = window.location.pathname;
      const currentHash = window.location.hash.replace(/^#/, "");
      const samePage = targetPath === currentPath;
      // Same content, other locale (LanguageSwitcher): keep the visitor's
      // scroll position instead of jumping back to the top of the page.
      const localeSwitch =
        !samePage && stripLocale(targetPath) === stripLocale(currentPath);

      if (samePage) {
        // In-page anchors keep the browser's smooth scrolling.
        if (targetHash && targetHash !== currentHash) return;
        // Same page (with or without the same hash) → no response at all:
        // never navigate, never reload (menu items close via their own state).
        event.preventDefault();
        return;
      }

      // A transition is already running — don't stack navigations.
      if (isTransitionBusy() || !beginTransition()) {
        event.preventDefault();
        return;
      }

      // Reduced motion: navigate normally without the curtain.
      if (prefersReducedMotion()) return;

      event.preventDefault();
      ensureOverlay();

      // Home from the contact section: same path, just dropping the hash —
      // still plays the full curtain, then scrolls back to the top.
      const dropsHash = samePage && !targetHash && Boolean(currentHash);

      // Entrance first, swap second: the curtain sweeps in completely, and
      // only then does the route change — so the new page always appears
      // behind the animation. The reveal follows the moment the route is
      // committed, keeping the whole move at the same ~1.4s rhythm.
      playCurtainIn();
      afterCover(() => {
        if (dropsHash) {
          window.history.pushState(null, "", targetPath);
          window.scrollTo({ top: 0, left: 0, behavior: "instant" });
          revealTransition();
        } else {
          router.push(href, localeSwitch ? { scroll: false } : undefined);
        }
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [router]);

  // The route changed — reveal the new page (and honour #anchors after it).
  // The refresh path owns its own reveal, so it is never cut short here.
  useEffect(() => {
    if (getTransitionReason() !== "refresh") {
      revealTransition();
    }

    const hash = window.location.hash;
    if (hash.length > 1) {
      const scrollTimer = window.setTimeout(() => {
        document
          .getElementById(hash.slice(1))
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 700);
      return () => window.clearTimeout(scrollTimer);
    }
  }, [pathname]);

  // Hard refresh: play the same curtain as menu/tab changes, then reveal.
  useEffect(() => {
    const [navigationEntry] = performance.getEntriesByType(
      "navigation"
    ) as PerformanceNavigationTiming[];
    if (navigationEntry?.type !== "reload" || prefersReducedMotion()) return;
    if (!beginTransition("refresh")) return;

    ensureOverlay();
    playCurtainIn();
    if (refreshTimer) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      revealTransition();
    }, 660);
  }, []);

  // The curtain lives in the DOM (outside React) — nothing to render.
  return null;
}
