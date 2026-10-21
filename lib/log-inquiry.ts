"use client";

export type InquirySourceValue =
  | "PRODUCT"
  | "INQUIRY_LIST"
  | "FLOATING"
  | "CONTACT";

/**
 * Tells the server that a WhatsApp button was pressed.
 *
 * Fire-and-forget by design: `keepalive` lets the request finish after the tab
 * navigates to WhatsApp, and every error is swallowed — analytics must never
 * stand between a customer and an order.
 */
export function logInquiry(
  source: InquirySourceValue,
  items: { productId: string; quantity: number }[] = [],
): void {
  try {
    void fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, items }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Offline, blocked by an extension, or the network is unavailable.
  }
}
