"use client";

import type { ReactNode } from "react";
import { logInquiry, type InquirySourceValue } from "@/lib/log-inquiry";

/**
 * A WhatsApp link that records the click before the tab leaves.
 * Used where the link is not already inside a client component.
 */
export function WhatsAppLink({
  href,
  source,
  className,
  ariaLabel,
  children,
}: {
  href: string;
  source: InquirySourceValue;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={ariaLabel}
      className={className}
      onClick={() => logInquiry(source)}
    >
      {children}
    </a>
  );
}
