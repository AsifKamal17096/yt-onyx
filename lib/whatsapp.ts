/**
 * WhatsApp link building.
 *
 * The number itself is never hard-coded and never read from the environment —
 * it lives in SiteSettings and is edited from the admin panel (lib/settings.ts).
 */

export type WhatsAppTemplateVars = {
  name?: string;
  sku?: string;
  price?: string;
  qty?: string | number;
  url?: string;
};

/**
 * Accepts anything a human might type — "+92 300 1234567", "0092-300-1234567",
 * "(92) 300 1234567" — and returns the digits-only form wa.me expects, or null
 * when the value cannot be a phone number.
 */
export function normalizeWhatsAppNumber(
  raw: string | null | undefined,
): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D+/g, "");
  // International prefixes: 00 92 … and 0 92 … both mean +92 …
  digits = digits.replace(/^0+/, "");

  // E.164 allows 8–15 digits including the country code.
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/** Pretty form for display: "+92 300 1234567" stays as the owner typed it. */
export function displayWhatsAppNumber(
  raw: string | null | undefined,
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("+") ? trimmed : `+${normalizeWhatsAppNumber(trimmed) ?? trimmed}`;
}

/** Replaces {name}, {sku}, {price}, {qty} and {url} in the saved template. */
export function renderWhatsAppTemplate(
  template: string,
  vars: WhatsAppTemplateVars,
): string {
  return template.replace(/\{(name|sku|price|qty|url)\}/g, (match, key) => {
    const value = vars[key as keyof WhatsAppTemplateVars];
    return value === undefined || value === null ? match : String(value);
  });
}

/**
 * Builds the wa.me deep link, or returns the Contact page when no number has
 * been set yet so a WhatsApp button never becomes a dead end.
 */
export function buildWhatsAppUrl(
  number: string | null | undefined,
  message: string,
): string {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return "/contact";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

/** True when the link points at WhatsApp rather than the fallback page. */
export function isWhatsAppUrl(url: string): boolean {
  return url.startsWith("https://wa.me/");
}
