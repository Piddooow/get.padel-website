"use client";

/**
 * Imperative curtain overlay for page transitions.
 *
 * The overlay lives in a DOM node appended to <body> (outside React) so it
 * SURVIVES the locale-layout remount that happens when the visitor switches
 * language — that remount is why React-owned overlays vanish mid-animation.
 * Every navigation (internal links, the menu, language switches) therefore
 * plays the exact same curtain.
 */
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";

export const OVERLAY_ID = "gp-page-transition";

/** Centered brand mark shown while the curtain covers the screen. */
const LOGO_SRC = "/logo-getpadel.webp";

export const PANEL_DURATION = 0.5;
export const PANEL_STAGGER = 0.08;
export const REVEAL_DELAY = 0.08;
export const CONTENT_DURATION = 0.5;

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

/**
 * Transition state machine — module scope so it survives the locale-layout
 * remount (component refs would reset mid-transition).
 */
type TransitionState = "idle" | "covering" | "revealing";
/** Who claimed the curtain — the refresh path reveals itself on its own timer. */
export type TransitionReason = "navigation" | "refresh";

let state: TransitionState = "idle";
let transitionReason: TransitionReason = "navigation";
let safetyTimer: number | null = null;

export function isTransitionBusy(): boolean {
  return state !== "idle";
}

export function getTransitionReason(): TransitionReason {
  return transitionReason;
}

/** Claims the transition slot; returns false when one is already running. */
export function beginTransition(
  reason: TransitionReason = "navigation"
): boolean {
  if (state !== "idle") return false;
  state = "covering";
  transitionReason = reason;
  if (safetyTimer) window.clearTimeout(safetyTimer);
  // Safety net: if the route never changes, reveal anyway.
  safetyTimer = window.setTimeout(() => {
    if (state === "covering") revealTransition();
  }, 4000);
  return true;
}

/** Reveals the new page (idempotent while the reveal is already running). */
export function revealTransition(): void {
  if (state === "idle" || state === "revealing") return;
  if (safetyTimer) {
    window.clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  state = "revealing";
  playCurtainOut(() => {
    state = "idle";
  });
}

/** Returns (creating on first use) the singleton curtain overlay. */
export function ensureOverlay(): HTMLElement {
  let overlay = document.getElementById(OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    overlay.setAttribute("aria-hidden", "true");
    overlay.className = "page-transition";
    for (let index = 0; index < 3; index++) {
      const panel = document.createElement("div");
      panel.className = "page-transition-panel";
      overlay.appendChild(panel);
    }

    // Brand mark (same artwork as the header logo, centred on the curtain).
    const logo = document.createElement("div");
    logo.className = "page-transition-logo";
    const image = document.createElement("img");
    image.src = LOGO_SRC;
    image.alt = "";
    image.decoding = "async";
    logo.appendChild(image);
    overlay.appendChild(logo);

    document.body.appendChild(overlay);
  }
  return overlay;
}

function panelsOf(overlay: HTMLElement): HTMLElement[] {
  return Array.from(
    overlay.querySelectorAll<HTMLElement>(".page-transition-panel")
  );
}

function logoOf(overlay: HTMLElement): HTMLElement | null {
  return overlay.querySelector<HTMLElement>(".page-transition-logo");
}

/** Chrome that eases back in with the revealed page (soft, no hard cut). */
export function contentTargets(): HTMLElement[] {
  return ["#main", "body > header", "body > footer"].flatMap((selector) => {
    const element = document.querySelector<HTMLElement>(selector);
    return element ? [element] : [];
  });
}

/** Sweeps the curtain in — covers the viewport. */
export function playCurtainIn(): gsap.core.Tween {
  const overlay = ensureOverlay();
  const panels = panelsOf(overlay);
  const logo = logoOf(overlay);
  gsap.set(overlay, { display: "block" });
  gsap.set(logo, { opacity: 0, y: 10, scale: 0.96 });

  const timeline = gsap.fromTo(
    panels,
    { xPercent: 101 },
    {
      xPercent: 0,
      duration: PANEL_DURATION,
      stagger: PANEL_STAGGER,
      ease: "main",
    }
  );

  // Simple, smooth mark reveal while the curtain is closing in.
  if (logo) {
    gsap.to(logo, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.35,
      delay: 0.1,
      ease: "power2.out",
    });
  }

  return timeline;
}

/** Sweeps the curtain out, eases the new page in, then hides the overlay. */
function playCurtainOut(onComplete: () => void): gsap.core.Timeline {
  const overlay = ensureOverlay();
  const panels = panelsOf(overlay);
  const content = contentTargets();
  const logo = logoOf(overlay);

  const timeline = gsap.timeline({
    delay: REVEAL_DELAY,
    onComplete: () => {
      gsap.set(overlay, { display: "none" });
      // Drop the temporary transform so sticky/fixed behaviour stays intact.
      if (content.length > 0) {
        gsap.set(content, { clearProps: "opacity,transform" });
      }
      onComplete();
    },
  });

  // The mark fades out first so the page reveal stays seamless.
  if (logo) {
    timeline.to(logo, { opacity: 0, duration: 0.45, ease: "power1.out" }, 0);
  }

  if (content.length > 0) {
    timeline.fromTo(
      content,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: CONTENT_DURATION,
        ease: "power2.out",
        stagger: 0.04,
      },
      0
    );
  }

  timeline.to(
    panels,
    {
      xPercent: 101,
      duration: PANEL_DURATION,
      stagger: PANEL_STAGGER,
      ease: "main",
    },
    0
  );

  return timeline;
}

/** Whether the visitor prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
