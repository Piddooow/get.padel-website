"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { whatsappLink } from "@/data/site";
import { cn } from "@/lib/utils";

type ButtonLinkProps = ComponentProps<typeof ButtonLink>;

interface WhatsAppButtonProps {
  /** Custom prefilled message (defaults to the general CS message). */
  message?: string;
  /** Custom label (defaults to "WhatsApp"). */
  label?: string;
  icon?: boolean;
  size?: ButtonLinkProps["size"];
  variant?: ButtonLinkProps["variant"];
  className?: string;
}

/**
 * One-click WhatsApp chat button — opens wa.me with a prefilled CS message.
 * Works in both server and client component trees; click events are tracked by
 * the delegated GA4 tracker (`CtaClickTracker`).
 */
export function WhatsAppButton({
  message,
  label,
  icon = true,
  size = "lg",
  variant = "default",
  className,
}: WhatsAppButtonProps) {
  const t = useTranslations("common");

  return (
    <ButtonLink
      href={whatsappLink(message ?? t("waMessage"))}
      external
      size={size}
      variant={variant}
      className={cn("rounded-full font-semibold", className)}
    >
      {icon && <WhatsAppIcon className="size-4" aria-hidden="true" />}
      {label ?? t("whatsapp")}
    </ButtonLink>
  );
}
