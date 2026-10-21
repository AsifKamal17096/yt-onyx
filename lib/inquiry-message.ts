import type { InquiryItem } from "@/lib/inquiry-store";
import { formatPrice, formatPriceAmount } from "@/lib/format";

/**
 * Builds the single WhatsApp message that carries a whole inquiry list.
 *
 * Kept separate from the product template (which the owner edits in settings)
 * because a list needs a different shape: one numbered line per piece, each
 * with its own link, and a subtotal for reference only.
 */
export function buildInquiryListMessage(
  items: InquiryItem[],
  siteUrl: string,
): string {
  const lines = items.map((item, index) => {
    const url = `${siteUrl}/product/${item.slug}`;
    return [
      `${index + 1}. ${item.name}`,
      `   SKU: ${item.sku}`,
      `   Quantity: ${item.quantity}`,
      `   Price: ${formatPriceAmount(item.priceCents)} USD each`,
      `   Link: ${url}`,
    ].join("\n");
  });

  const subtotal = items.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0,
  );

  return [
    "Hello YT Onyx! I'm interested in the following pieces:",
    "",
    lines.join("\n\n"),
    "",
    `Items subtotal: ${formatPrice(subtotal)} USD (before shipping)`,
    "",
    "Please confirm availability, shipping cost and delivery time to my country.",
  ].join("\n");
}
