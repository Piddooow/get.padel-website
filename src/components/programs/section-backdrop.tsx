import Image from "next/image";

/**
 * Decorative section backdrop for the Program page: a venue photo under a
 * palette-safe overlay, so sections feel alive without hurting readability
 * (the overlay keeps body copy at AA contrast).
 */
export function SectionBackdrop({
  image,
  position = "center",
}: {
  image: string;
  /** CSS object-position for the crop (e.g. "center 30%"). */
  position?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(min-width: 1280px) 1152px, 100vw"
        className="object-cover"
        style={{ objectPosition: position }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/88 to-background/72" />
    </div>
  );
}
