"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MarqueeTestimonial {
  id: string;
  text: string;
  name: string;
  /** Provenance line, e.g. "Google · 5 bulan lalu". */
  meta: string;
  rating: number;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** One vertically auto-scrolling column (duplicated for a seamless loop). */
function TestimonialsColumn({
  items,
  duration,
  className,
}: {
  items: MarqueeTestimonial[];
  duration: number;
  className?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={className}>
      <motion.ul
        animate={shouldReduceMotion ? undefined : { translateY: "-50%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="m-0 flex list-none flex-col gap-6 bg-transparent p-0 pb-6"
      >
        {[0, 1].map((copy) => (
          <React.Fragment key={copy}>
            {items.map((item) => (
              <motion.li
                key={`${copy}-${item.id}`}
                aria-hidden={copy === 1 ? "true" : "false"}
                tabIndex={copy === 1 ? -1 : 0}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 1.03,
                        y: -6,
                        transition: { type: "spring", stiffness: 400, damping: 18 },
                      }
                }
                className="w-full max-w-xs cursor-default select-none rounded-3xl bg-card p-7 text-sm ring-1 ring-gp-olive/10 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/5 focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none"
              >
                <blockquote className="m-0 p-0">
                  <span
                    role="img"
                    aria-label={`${item.rating} / 5`}
                    className="flex items-center gap-0.5 text-gp-rust"
                  >
                    {Array.from({ length: item.rating }).map((_, index) => (
                      <Star
                        key={index}
                        className="size-3.5 fill-current"
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                  <footer className="mt-5 flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-gp-olive/10 font-heading text-sm font-bold text-gp-olive"
                    >
                      {initials(item.name)}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <cite className="truncate font-semibold not-italic tracking-tight">
                        {item.name}
                      </cite>
                      <span className="truncate text-xs text-muted-foreground">
                        {item.meta}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  );
}

/**
 * Testimonials marquee (adapted from the reference component): three
 * auto-scrolling columns of visitor reviews, with palette styling, initials
 * avatars and reduced-motion support.
 */
export function TestimonialsMarquee({
  badge,
  title,
  subtitle,
  label,
  testimonials,
}: {
  badge: string;
  title: string;
  subtitle: string;
  /** Region label for assistive tech, e.g. "Ulasan pengunjung". */
  label: string;
  testimonials: MarqueeTestimonial[];
}) {
  const shouldReduceMotion = useReducedMotion();
  const columns = [
    testimonials.slice(0, 3),
    testimonials.slice(3, 6),
    testimonials.slice(6, 9),
  ];
  const durations = [15, 19, 17];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 40 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mx-auto mb-12 flex max-w-[560px] flex-col items-center">
        <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-4 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
          {badge}
        </span>
        <h2
          id="testimonials-heading"
          className="font-heading mt-5 text-center text-3xl font-extrabold tracking-tight sm:text-4xl"
        >
          {title}
        </h2>
        <p className="mt-4 max-w-sm text-center text-muted-foreground">
          {subtitle}
        </p>
      </div>

      <div
        role="region"
        aria-label={label}
        className={cn(
          "flex max-h-[720px] justify-center gap-6 overflow-hidden",
          "[mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
        )}
      >
        {columns.map((items, index) =>
          items.length > 0 ? (
            <TestimonialsColumn
              key={index}
              items={items}
              duration={durations[index] ?? 16}
              className={cn(
                index === 1 && "hidden md:block",
                index === 2 && "hidden lg:block"
              )}
            />
          ) : null
        )}
      </div>
    </motion.div>
  );
}
