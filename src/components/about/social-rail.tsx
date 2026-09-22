"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { socialAccounts, type SocialPost } from "@/data/social-posts";
import { cn } from "@/lib/utils";

/**
 * Snap-scrolling rail of archived Instagram posts. Each card carries the
 * post's own artwork plus a systematic accent per account (rust for
 * @get.padel, bottle green for @racerallycoffee) so the two brands never blur
 * together. Arrow buttons drive it on desktop; touch devices just swipe.
 */
export function SocialRail({
  posts,
  openLabel,
  prevLabel,
  nextLabel,
}: {
  posts: SocialPost[];
  openLabel: string;
  prevLabel: string;
  nextLabel: string;
}) {
  const railRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setAtStart(rail.scrollLeft <= 4);
    setAtEnd(rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(sync);
    const rail = railRef.current;
    if (!rail) return () => window.cancelAnimationFrame(frame);
    const onScroll = () => sync();
    rail.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.cancelAnimationFrame(frame);
      rail.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sync]);

  const step = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({
      left: direction * Math.min(rail.clientWidth * 0.85, 360),
      behavior: "smooth",
    });
  };

  return (
    <div>
      <div className="mb-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={atStart}
          aria-label={prevLabel}
          className="inline-flex size-11 items-center justify-center rounded-full border border-gp-olive/20 bg-card text-gp-olive transition-colors hover:bg-gp-olive/5 focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={atEnd}
          aria-label={nextLabel}
          className="inline-flex size-11 items-center justify-center rounded-full border border-gp-olive/20 bg-card text-gp-olive transition-colors hover:bg-gp-olive/5 focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul
        ref={railRef}
        className="flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-3 focus-visible:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {posts.map((post) => {
          const account = socialAccounts[post.account];
          const venueAccount = post.account === "getpadel";

          return (
            <li
              key={post.id}
              className="w-[280px] shrink-0 snap-start sm:w-[320px]"
            >
              <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10 transition-shadow hover:shadow-md hover:shadow-black/5">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-gp-olive/5">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="(min-width: 640px) 320px, 280px"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-full",
                        venueAccount
                          ? "bg-gp-rust/10 text-gp-rust"
                          : "bg-[#074734]/10 text-[#074734]"
                      )}
                    >
                      <InstagramIcon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {account.handle}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {post.date}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.caption}
                  </p>

                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-5 inline-flex h-11 items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline",
                      venueAccount ? "text-gp-rust" : "text-[#074734]"
                    )}
                  >
                    {openLabel}
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </a>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
