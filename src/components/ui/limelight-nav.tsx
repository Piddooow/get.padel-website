"use client";

import React, {
  cloneElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// --- Internal Types and Defaults ---

const DefaultHomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const DefaultCompassIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
  </svg>
);
const DefaultBellIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export type NavItem = {
  id: string | number;
  icon: React.ReactElement<{ className?: string }>;
  label?: string;
  /** In-app destination — the global page transition handles the curtain. */
  href?: string;
  onClick?: () => void;
};

const defaultNavItems: NavItem[] = [
  { id: "default-home", icon: <DefaultHomeIcon />, label: "Home" },
  { id: "default-explore", icon: <DefaultCompassIcon />, label: "Explore" },
  {
    id: "default-notifications",
    icon: <DefaultBellIcon />,
    label: "Notifications",
  },
];

type LimelightNavProps = {
  items?: NavItem[];
  /** Uncontrolled initial tab (ignored when `activeIndex` is provided). */
  defaultActiveIndex?: number;
  /** Controlled active tab — pass -1 when no tab matches the route. */
  activeIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
  "aria-label"?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights
 * the active item (adapted to the Get Padel palette and lucide icons).
 */
export const LimelightNav = ({
  items = defaultNavItems,
  defaultActiveIndex = 0,
  activeIndex: controlledIndex,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
  "aria-label": ariaLabel,
}: LimelightNavProps) => {
  const [internalIndex, setInternalIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  const activeIndex = controlledIndex ?? internalIndex;
  const hasActive = activeIndex >= 0 && activeIndex < items.length;

  /** Centres the limelight under the active item (called on every layout change). */
  const positionLimelight = useCallback(() => {
    const limelight = limelightRef.current;
    const activeItem = hasActive ? navItemRefs.current[activeIndex] : null;
    if (!limelight || !activeItem) return;

    const newLeft =
      activeItem.offsetLeft +
      activeItem.offsetWidth / 2 -
      limelight.offsetWidth / 2;
    limelight.style.left = `${newLeft}px`;
  }, [activeIndex, hasActive]);

  useLayoutEffect(() => {
    if (items.length === 0) return;
    positionLimelight();

    const nav = navRef.current;
    if (nav && !isReady) {
      window.setTimeout(() => setIsReady(true), 50);
    }
  }, [items.length, isReady, positionLimelight]);

  // Breakpoint/resize changes (e.g. desktop → phone) move the items around:
  // keep the limelight glued to the active item.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => positionLimelight());
    observer.observe(nav);
    for (const item of navItemRefs.current) {
      if (item) observer.observe(item);
    }
    return () => observer.disconnect();
  }, [positionLimelight, items.length]);

  if (items.length === 0) {
    return null;
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setInternalIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav
      ref={navRef}
      aria-label={ariaLabel}
      className={`relative inline-flex h-14 items-center overflow-hidden rounded-full border border-gp-olive/10 bg-card/95 px-3 text-gp-olive shadow-lg shadow-gp-olive/10 backdrop-blur-md md:h-16 md:px-4 ${className ?? ""}`}
    >
      {items.map(({ id, icon, label, href, onClick }, index) => (
        <a
          key={id}
          ref={(el) => {
            navItemRefs.current[index] = el;
          }}
          href={href}
          className={`relative z-20 flex h-full cursor-pointer items-center justify-center p-4 transition-opacity duration-150 ease-out active:opacity-70 md:p-5 ${iconContainerClassName ?? ""}`}
          onClick={() => handleItemClick(index, onClick)}
          aria-label={label}
          aria-current={hasActive && activeIndex === index ? "page" : undefined}
        >
          {cloneElement(icon, {
            className: `size-5 transition-opacity duration-100 ease-in-out md:size-6 ${
              hasActive && activeIndex === index ? "opacity-100" : "opacity-40"
            } ${icon.props.className ?? ""} ${iconClassName ?? ""}`,
          })}
        </a>
      ))}

      <div
        ref={limelightRef}
        aria-hidden="true"
        className={`absolute top-0 z-10 h-[4px] w-10 rounded-full bg-gp-rust shadow-[0_28px_14px_rgba(142,65,34,0.45)] md:h-[5px] md:w-11 ${
          isReady ? "transition-[left,opacity] duration-[400ms] ease-in-out" : ""
        } ${hasActive ? "opacity-100" : "opacity-0"} ${limelightClassName ?? ""}`}
        style={{ left: "-999px" }}
      >
        <div className="pointer-events-none absolute top-[4px] left-[-30%] h-12 w-[160%] bg-gradient-to-b from-gp-rust/30 to-transparent [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] md:top-[5px] md:h-14" />
      </div>
    </nav>
  );
};
