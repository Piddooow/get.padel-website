"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface GalleryPhotoView {
  id: string;
  src: string;
  alt: string;
}

/** Mosaic layout derived from the position (works for any photo count). */
function photoClassName(index: number, total: number): string {
  if (index === 0 && total >= 4) return "col-span-2 row-span-2";
  if (index === total - 1 && total >= 3) return "col-span-2";
  return "";
}

/**
 * Venue photo gallery with a lightbox: title top-left and a close button
 * top-right (both inside the frame). Navigation is strictly sequential — the
 * first/last photo disable their arrow, so slides never loop around.
 */
export function GalleryLightbox({ photos }: { photos: GalleryPhotoView[] }) {
  const t = useTranslations("proof");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const open = activeIndex !== null;

  const atFirst = activeIndex === 0;
  const atLast = activeIndex === photos.length - 1;

  const step = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((current) => {
        if (current === null) return current;
        return Math.min(Math.max(current + direction, 0), photos.length - 1);
      });
    },
    [photos.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Capture phase: the dialog primitive consumes arrow keys internally.
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, step]);

  const active = photos[activeIndex ?? 0];

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className={cn(
              "relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted ring-1 ring-gp-olive/10",
              photoClassName(index, photos.length)
            )}
          >
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${t("galleryOpen")}: ${photo.alt}`}
              className="group absolute inset-0 cursor-zoom-in focus-visible:ring-2 focus-visible:ring-gp-olive/60 focus-visible:outline-none"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span
                aria-hidden="true"
                className="absolute right-2.5 bottom-2.5 inline-flex size-8 items-center justify-center rounded-full bg-gp-olive/70 text-gp-light opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                <Maximize2 className="size-3.5" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!value) setActiveIndex(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden rounded-2xl bg-gp-olive p-0 text-gp-light ring-1 ring-gp-light/15 sm:max-w-4xl"
        >
          {/* Frame header: title left, close right — both inside the border */}
          <div className="flex items-center justify-between gap-3 border-b border-gp-light/15 px-4 py-3 sm:px-5">
            <DialogTitle className="min-w-0 truncate text-sm font-semibold">
              {active?.alt}
            </DialogTitle>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t("galleryClose")}
                  className="shrink-0 rounded-full border-gp-light/30 bg-transparent text-gp-light hover:bg-white/10 hover:text-gp-light"
                />
              }
            >
              <X className="size-4" />
            </DialogClose>
          </div>

          <div className="relative aspect-[4/3] w-full bg-black/25 sm:aspect-[16/10]">
            <Image
              src={active.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 896px, 100vw"
              className="object-contain"
            />
          </div>

          {/* Frame footer: counter + strictly sequential navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-gp-light/15 px-4 py-3 sm:px-5">
            <p className="text-xs tabular-nums text-gp-light/75">
              {t("galleryCounter", {
                current: (activeIndex ?? 0) + 1,
                total: photos.length,
              })}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label={t("galleryPrev")}
                disabled={atFirst}
                onClick={() => step(-1)}
                className="rounded-full border-gp-light/30 bg-transparent text-gp-light hover:bg-white/10 hover:text-gp-light"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label={t("galleryNext")}
                disabled={atLast}
                onClick={() => step(1)}
                className="rounded-full border-gp-light/30 bg-transparent text-gp-light hover:bg-white/10 hover:text-gp-light"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
