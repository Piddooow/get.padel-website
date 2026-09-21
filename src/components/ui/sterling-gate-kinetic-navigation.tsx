"use client";

import { useCallback, useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ArrowUpRight } from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { site, whatsappLink } from "@/data/site";

// Register GSAP plugins safely (client only).
if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase);
}

interface MenuLink {
  key:
    | "home"
    | "schedule"
    | "pricing"
    | "location"
    | "program"
    | "help"
    | "booking"
    | "contact"
    | "whatsapp";
  href: string;
  external?: boolean;
  index: string;
  shape: number;
}

type MenuItemWithCleanup = HTMLElement & { _cleanup?: () => void };

/**
 * Kinetic fullscreen navigation (Sterling Gate adaptation).
 * Controlled overlay: the site header owns the trigger button and passes
 * `open` / `onClose`. All links point at real Get Padel destinations.
 */
export function SterlingGateKineticNavigation({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const t = useTranslations();
  const locale = useLocale();
  const waHref = whatsappLink(t("common.waMessage"));

  const links: MenuLink[] = [
    { key: "home", href: `/${locale}`, index: "01", shape: 1 },
    { key: "schedule", href: `/${locale}/jadwal`, index: "02", shape: 2 },
    { key: "pricing", href: `/${locale}/harga`, index: "03", shape: 6 },
    { key: "location", href: `/${locale}/lokasi`, index: "04", shape: 7 },
    { key: "program", href: `/${locale}/program`, index: "05", shape: 8 },
    { key: "help", href: `/${locale}/bantuan`, index: "06", shape: 9 },
    { key: "booking", href: `/${locale}/pesan`, index: "07", shape: 3 },
    { key: "contact", href: `/${locale}#kontak`, index: "08", shape: 4 },
    { key: "whatsapp", href: waHref, external: true, index: "09", shape: 5 },
  ];

  const labels: Record<MenuLink["key"], string> = {
    home: t("nav.home"),
    schedule: t("nav.schedule"),
    pricing: t("menu.pricing"),
    location: t("nav.location"),
    program: t("nav.program"),
    help: t("nav.help"),
    booking: t("common.bookNow"),
    contact: t("nav.contact"),
    whatsapp: t("common.whatsapp"),
  };

  const handleLinkClick = useCallback(() => {
    onClose();
  }, [onClose]);

  /* ---------- initial setup + hover shapes ---------- */
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    try {
      if (!gsap.parseEase("main")) {
        CustomEase.create("main", "0.65, 0.01, 0.05, 0.99");
        gsap.defaults({ ease: "main", duration: 0.7 });
      }
    } catch (error) {
      console.warn("CustomEase failed to load, falling back.", error);
      gsap.defaults({ ease: "power2.out", duration: 0.7 });
    }

    const ctx = gsap.context(() => {
      const menuItems = container.querySelectorAll(
        ".menu-list-item[data-shape]"
      );
      const shapesContainer = container.querySelector(
        ".ambient-background-shapes"
      );

      menuItems.forEach((item) => {
        const shapeIndex = item.getAttribute("data-shape");
        const shape = shapesContainer?.querySelector(`.bg-shape-${shapeIndex}`);
        if (!shape) return;

        const shapeEls = shape.querySelectorAll(".shape-element");

        const onEnter = () => {
          shapesContainer
            ?.querySelectorAll(".bg-shape")
            .forEach((element) => element.classList.remove("active"));
          shape.classList.add("active");

          gsap.fromTo(
            shapeEls,
            { scale: 0.5, opacity: 0, rotation: -10 },
            {
              scale: 1,
              opacity: 1,
              rotation: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: "back.out(1.7)",
              overwrite: "auto",
            }
          );
        };

        const onLeave = () => {
          gsap.to(shapeEls, {
            scale: 0.8,
            opacity: 0,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => shape.classList.remove("active"),
            overwrite: "auto",
          });
        };

        item.addEventListener("mouseenter", onEnter);
        item.addEventListener("mouseleave", onLeave);

        (item as MenuItemWithCleanup)._cleanup = () => {
          item.removeEventListener("mouseenter", onEnter);
          item.removeEventListener("mouseleave", onLeave);
        };
      });
    }, container);

    return () => {
      ctx.revert();
      container
        .querySelectorAll(".menu-list-item[data-shape]")
        .forEach((item) => {
          const cleanup = (item as MenuItemWithCleanup)._cleanup;
          if (cleanup) cleanup();
        });
    };
  }, []);

  /* ---------- open / close timeline ---------- */
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Skip the initial mount run (first render is always closed).
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const navWrap = container.querySelector(".nav-overlay-wrapper");
    const menu = container.querySelector(".menu-content");
    const overlay = container.querySelector(".overlay");
    const bgPanels = container.querySelectorAll(".backdrop-layer");
    const menuLinks = container.querySelectorAll(".nav-link");
    const fadeTargets = container.querySelectorAll("[data-menu-fade]");

    // Kill the previous timeline instead of reverting it, so the close
    // animation starts from the exact state the open animation left behind.
    timelineRef.current?.kill();
    timelineRef.current = null;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      navWrap?.setAttribute("data-nav", open ? "open" : "closed");
      if (open) {
        gsap.set(navWrap, { display: "block" });
        gsap.set([menu, overlay, ...bgPanels, ...menuLinks, ...fadeTargets], {
          clearProps: "all",
        });
      } else {
        gsap.set(navWrap, { display: "none" });
      }
      return;
    }

    const tl = gsap.timeline();
    timelineRef.current = tl;

    if (open) {
      navWrap?.setAttribute("data-nav", "open");

      tl.set(navWrap, { display: "block" })
        .fromTo(menu, { xPercent: 120 }, { xPercent: 0, duration: 0.75 }, "<")
        .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, "<")
        .fromTo(
          bgPanels,
          { xPercent: 101 },
          { xPercent: 0, stagger: 0.12, duration: 0.575 },
          "<"
        )
        .fromTo(
          menuLinks,
          { yPercent: 140, rotate: 10 },
          { yPercent: 0, rotate: 0, stagger: 0.05 },
          "<+=0.35"
        );

      if (fadeTargets.length) {
        tl.fromTo(
          fadeTargets,
          { autoAlpha: 0, yPercent: 50 },
          {
            autoAlpha: 1,
            yPercent: 0,
            stagger: 0.04,
            clearProps: "all",
          },
          "<+=0.2"
        );
      }
    } else {
      navWrap?.setAttribute("data-nav", "closed");

      // Mirror of the open sequence: meta text leaves, links cascade out,
      // backdrop panels sweep back, then the panel and scrim follow.
      if (fadeTargets.length) {
        tl.to(fadeTargets, {
          autoAlpha: 0,
          yPercent: 40,
          duration: 0.3,
          stagger: 0.03,
          ease: "power2.in",
        });
      }

      tl.to(
        menuLinks,
        {
          yPercent: 140,
          rotate: 10,
          duration: 0.45,
          stagger: 0.04,
          ease: "power2.in",
        },
        "<+=0.05"
      )
        .to(
          bgPanels,
          {
            xPercent: 101,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.in",
          },
          "<+=0.05"
        )
        .to(
          menu,
          { xPercent: 120, duration: 0.7, ease: "power2.inOut" },
          "<+=0.15"
        )
        .to(overlay, { autoAlpha: 0, duration: 0.5 }, "<+=0.1")
        .set(navWrap, { display: "none" });
    }

    return () => {
      tl.kill();
      if (timelineRef.current === tl) {
        timelineRef.current = null;
      }
    };
  }, [open]);

  /* ---------- escape key, scroll lock, initial focus ---------- */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const firstLink = containerRef.current?.querySelector<HTMLElement>(
        ".nav-link"
      );
      firstLink?.focus({ preventScroll: true });
    }, 150);

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="kinetic-menu">
      <section className="fullscreen-menu-container">
        <div
          id="site-menu"
          data-nav="closed"
          className="nav-overlay-wrapper"
          aria-hidden={!open}
        >
          <div className="overlay" onClick={onClose} />
          <nav
            className="menu-content"
            role="dialog"
            aria-modal="true"
            aria-label={t("menu.title")}
          >
            <div className="menu-bg">
              <div className="backdrop-layer first"></div>
              <div className="backdrop-layer second"></div>
              <div className="backdrop-layer main"></div>

              {/* Ambient shapes (revealed on link hover) */}
              <div className="ambient-background-shapes" aria-hidden="true">
                {/* Shape 1: floating circles */}
                <svg className="bg-shape bg-shape-1" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="80" cy="120" r="40" fill="rgba(231,231,231,0.06)" />
                  <circle className="shape-element" cx="300" cy="80" r="60" fill="rgba(142,65,34,0.22)" />
                  <circle className="shape-element" cx="200" cy="300" r="80" fill="rgba(231,231,231,0.05)" />
                  <circle className="shape-element" cx="350" cy="280" r="30" fill="rgba(142,65,34,0.16)" />
                </svg>

                {/* Shape 2: wave pattern */}
                <svg className="bg-shape bg-shape-2" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M0 200 Q100 100, 200 200 T 400 200" stroke="rgba(142,65,34,0.24)" strokeWidth="60" fill="none" />
                  <path className="shape-element" d="M0 280 Q100 180, 200 280 T 400 280" stroke="rgba(231,231,231,0.07)" strokeWidth="40" fill="none" />
                </svg>

                {/* Shape 3: grid dots */}
                <svg className="bg-shape bg-shape-3" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="50" cy="50" r="8" fill="rgba(231,231,231,0.28)" />
                  <circle className="shape-element" cx="150" cy="50" r="8" fill="rgba(142,65,34,0.4)" />
                  <circle className="shape-element" cx="250" cy="50" r="8" fill="rgba(231,231,231,0.22)" />
                  <circle className="shape-element" cx="350" cy="50" r="8" fill="rgba(142,65,34,0.32)" />
                  <circle className="shape-element" cx="100" cy="150" r="12" fill="rgba(231,231,231,0.22)" />
                  <circle className="shape-element" cx="200" cy="150" r="12" fill="rgba(142,65,34,0.32)" />
                  <circle className="shape-element" cx="300" cy="150" r="12" fill="rgba(231,231,231,0.28)" />
                  <circle className="shape-element" cx="50" cy="250" r="10" fill="rgba(142,65,34,0.4)" />
                  <circle className="shape-element" cx="150" cy="250" r="10" fill="rgba(231,231,231,0.22)" />
                  <circle className="shape-element" cx="250" cy="250" r="10" fill="rgba(142,65,34,0.32)" />
                  <circle className="shape-element" cx="350" cy="250" r="10" fill="rgba(231,231,231,0.28)" />
                  <circle className="shape-element" cx="100" cy="350" r="6" fill="rgba(231,231,231,0.3)" />
                  <circle className="shape-element" cx="200" cy="350" r="6" fill="rgba(142,65,34,0.4)" />
                  <circle className="shape-element" cx="300" cy="350" r="6" fill="rgba(231,231,231,0.24)" />
                </svg>

                {/* Shape 4: organic blobs */}
                <svg className="bg-shape bg-shape-4" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M100 100 Q150 50, 200 100 Q250 150, 200 200 Q150 250, 100 200 Q50 150, 100 100" fill="rgba(231,231,231,0.05)" />
                  <path className="shape-element" d="M250 200 Q300 150, 350 200 Q400 250, 350 300 Q300 350, 250 300 Q200 250, 250 200" fill="rgba(142,65,34,0.16)" />
                </svg>

                {/* Shape 5: diagonal lines */}
                <svg className="bg-shape bg-shape-5" viewBox="0 0 400 400" fill="none">
                  <line className="shape-element" x1="0" y1="100" x2="300" y2="400" stroke="rgba(142,65,34,0.2)" strokeWidth="30" />
                  <line className="shape-element" x1="100" y1="0" x2="400" y2="300" stroke="rgba(231,231,231,0.07)" strokeWidth="25" />
                  <line className="shape-element" x1="200" y1="0" x2="400" y2="200" stroke="rgba(142,65,34,0.14)" strokeWidth="20" />
                </svg>

                {/* Shape 6: concentric rings */}
                <svg className="bg-shape bg-shape-6" viewBox="0 0 400 400" fill="none">
                  <circle className="shape-element" cx="200" cy="200" r="60" stroke="rgba(142,65,34,0.35)" strokeWidth="18" fill="none" />
                  <circle className="shape-element" cx="200" cy="200" r="120" stroke="rgba(231,231,231,0.13)" strokeWidth="14" fill="none" />
                  <circle className="shape-element" cx="200" cy="200" r="180" stroke="rgba(142,65,34,0.16)" strokeWidth="10" fill="none" />
                </svg>

                {/* Shape 7: crossed arcs */}
                <svg className="bg-shape bg-shape-7" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M40 360 Q200 40, 360 360" stroke="rgba(142,65,34,0.22)" strokeWidth="46" fill="none" />
                  <path className="shape-element" d="M40 40 Q200 360, 360 40" stroke="rgba(231,231,231,0.06)" strokeWidth="34" fill="none" />
                  <circle className="shape-element" cx="200" cy="200" r="26" fill="rgba(142,65,34,0.2)" />
                </svg>

                {/* Shape 8: rising bars */}
                <svg className="bg-shape bg-shape-8" viewBox="0 0 400 400" fill="none">
                  <rect className="shape-element" x="60" y="240" width="48" height="120" rx="24" fill="rgba(142,65,34,0.24)" />
                  <rect className="shape-element" x="140" y="180" width="48" height="180" rx="24" fill="rgba(231,231,231,0.07)" />
                  <rect className="shape-element" x="220" y="120" width="48" height="240" rx="24" fill="rgba(142,65,34,0.18)" />
                  <rect className="shape-element" x="300" y="60" width="48" height="300" rx="24" fill="rgba(231,231,231,0.05)" />
                </svg>

                {/* Shape 9: question-mark curves */}
                <svg className="bg-shape bg-shape-9" viewBox="0 0 400 400" fill="none">
                  <path className="shape-element" d="M150 140 Q150 80, 210 80 Q270 80, 270 140 Q270 190, 210 200 Q205 202, 205 240" stroke="rgba(142,65,34,0.26)" strokeWidth="26" strokeLinecap="round" fill="none" />
                  <circle className="shape-element" cx="205" cy="290" r="16" fill="rgba(231,231,231,0.12)" />
                  <circle className="shape-element" cx="90" cy="320" r="40" fill="rgba(142,65,34,0.14)" />
                  <circle className="shape-element" cx="330" cy="70" r="34" fill="rgba(231,231,231,0.06)" />
                </svg>
              </div>
            </div>

            <div className="menu-content-wrapper">
              <div className="menu-head" data-menu-fade>
                <p className="menu-head-tagline">{t("common.tagline")}</p>
                <p className="menu-head-venue">{t("menu.venueLine")}</p>
              </div>

              <ul className="menu-list">
                {links.map((link) => (
                  <li
                    key={link.key}
                    className="menu-list-item"
                    data-shape={link.shape}
                  >
                    <a
                      href={link.href}
                      onClick={handleLinkClick}
                      className="nav-link"
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      <span className="nav-link-index" aria-hidden="true">
                        {link.index}
                      </span>
                      <span className="nav-link-text">{labels[link.key]}</span>
                      {link.external && (
                        <ArrowUpRight
                          className="nav-link-external-icon"
                          aria-hidden="true"
                        />
                      )}
                      <span className="nav-link-hover-bg" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>

              <div className="menu-info-block">
                <div className="menu-info">
                  <div data-menu-fade>
                    <p className="menu-info-title">{t("footer.contactTitle")}</p>
                    <div className="menu-info-body">
                      {site.address.street}
                      <br />
                      {site.address.district}
                      <br />
                      {site.address.city}
                    </div>
                  </div>

                  <div data-menu-fade>
                    <p className="menu-info-title">{t("footer.hoursTitle")}</p>
                    <div className="menu-info-body">
                      {t("footer.courtHoursLabel")}: {t("footer.courtHours")}
                      <br />
                      {t("footer.cafeHoursLabel")}: {t("footer.cafeHours")}
                    </div>
                  </div>

                  <div data-menu-fade>
                    <p className="menu-info-title">{t("common.whatsapp")}</p>
                    <div className="menu-info-body">
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {site.contact.whatsappDisplay}
                      </a>
                      <br />
                      <a href={`mailto:${site.contact.emailEvent}`}>
                        {site.contact.emailEvent}
                      </a>
                    </div>
                  </div>

                  <div data-menu-fade>
                    <p className="menu-info-title">
                      {t("footer.followTitle")}
                    </p>
                    <div className="menu-info-socials">
                      <a
                        href={site.links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram @get.padel"
                      >
                        <InstagramIcon className="size-4" />
                      </a>
                      <a
                        href={site.links.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="TikTok @get.padel"
                      >
                        <TikTokIcon className="size-4" />
                      </a>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`WhatsApp ${site.contact.whatsappDisplay}`}
                      >
                        <WhatsAppIcon className="size-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="menu-foot" data-menu-fade>
                <p className="menu-foot-note">{t("menu.footNote")}</p>
              </div>
            </div>
          </nav>
        </div>
      </section>
    </div>
  );
}
