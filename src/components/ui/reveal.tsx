"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealState = "visible" | "hidden";

/**
 * Scroll-reveal wrapper: fades/slides content in when it enters the viewport.
 * - SSR renders content visible (safe with JS disabled / for crawlers).
 * - Content already in view on mount is left untouched (no flash).
 * - `prefers-reduced-motion` users get no animation at all.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>("visible");

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Already in (or near) the viewport on mount → keep it visible.
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setState("visible");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        state === "hidden" ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100",
        className
      )}
    >
      {children}
    </div>
  );
}
