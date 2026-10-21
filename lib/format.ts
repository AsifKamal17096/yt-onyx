/**
 * Formatting helpers. Prices are stored as integer USD cents everywhere and
 * only become text here, so the whole site shows one consistent format.
 */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 125000 -> "$1,250.00" */
export function formatPrice(cents: number): string {
  return usd.format(cents / 100);
}

/** Price without decimals when it is a round amount: 125000 -> "$1,250" */
export function formatPriceCompact(cents: number): string {
  return cents % 100 === 0
    ? usd.format(cents / 100).replace(/\.00$/, "")
    : usd.format(cents / 100);
}

/** "1,250.00" — the number only, for the WhatsApp message template. */
export function formatPriceAmount(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Discount percentage, rounded, or null when there is no saving. */
export function discountPercent(
  priceCents: number,
  compareAtCents: number | null | undefined,
): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null;
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100);
}

type Dimensions = {
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensionUnit?: string | null;
};

/** "30 x 18 x 45 cm", skipping any missing axis. */
export function formatDimensions(product: Dimensions): string | null {
  const parts = [product.length, product.width, product.height].filter(
    (value): value is number => typeof value === "number" && value > 0,
  );
  if (parts.length === 0) return null;
  const unit = product.dimensionUnit?.trim() || "cm";
  return `${parts.map(trimNumber).join(" × ")} ${unit}`;
}

export function formatWeight(
  weight?: number | null,
  unit?: string | null,
): string | null {
  if (typeof weight !== "number" || weight <= 0) return null;
  return `${trimNumber(weight)} ${unit?.trim() || "kg"}`;
}

/** 4.0 -> "4", 4.5 -> "4.5" */
function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

const AVAILABILITY_LABELS = {
  IN_STOCK: "In Stock",
  MADE_TO_ORDER: "Made to Order",
  OUT_OF_STOCK: "Out of Stock",
} as const;

export type AvailabilityValue = keyof typeof AVAILABILITY_LABELS;

export function availabilityLabel(value: AvailabilityValue): string {
  return AVAILABILITY_LABELS[value] ?? "In Stock";
}

export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
