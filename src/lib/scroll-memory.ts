"use client";

/** Remembers the scroll position per pathname (sessionStorage). */
const STORAGE_KEY = "gp-scroll-positions";

function readAll(): Record<string, number> {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function saveScrollPosition(pathname: string, y: number): void {
  try {
    const all = readAll();
    all[pathname] = Math.max(0, Math.round(y));
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage can be blocked — scroll memory is a nicety, not a requirement.
  }
}

export function readScrollPosition(pathname: string): number {
  return readAll()[pathname] ?? 0;
}

/** rAF-throttled scroll listener that keeps the current position saved. */
export function trackScrollPosition(pathname: string): () => void {
  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      saveScrollPosition(pathname, window.scrollY);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    window.removeEventListener("scroll", onScroll);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
