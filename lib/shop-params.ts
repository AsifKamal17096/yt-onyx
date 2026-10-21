import {
  SORT_OPTIONS,
  type ProductQuery,
  type SortKey,
} from "@/lib/product-query";

/**
 * URL <-> query translation for the shop and category pages.
 *
 * Filters live in the URL rather than in component state: the result is
 * shareable, back-button friendly, server-rendered and cacheable per
 * combination.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const PER_PAGE = 12;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function positiveNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function parseProductQuery(
  params: RawSearchParams,
  overrides: Partial<ProductQuery> = {},
): ProductQuery {
  const sortValue = first(params.sort);
  const sort: SortKey =
    sortValue && sortValue in SORT_OPTIONS ? (sortValue as SortKey) : "newest";

  const minPrice = positiveNumber(first(params.min));
  const maxPrice = positiveNumber(first(params.max));

  return {
    q: first(params.q),
    category: first(params.category),
    stone: first(params.stone),
    color: first(params.color),
    finish: first(params.finish),
    // Swap reversed bounds instead of returning nothing.
    minPrice:
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? maxPrice
        : minPrice,
    maxPrice:
      minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice
        ? minPrice
        : maxPrice,
    sort,
    page: Math.max(1, Number(first(params.page) ?? 1) || 1),
    perPage: PER_PAGE,
    ...overrides,
  };
}

/** Keys that live in the shop URL, in a stable order. */
const URL_KEYS = [
  "q",
  "category",
  "stone",
  "color",
  "finish",
  "min",
  "max",
  "sort",
  "page",
] as const;

export type UrlPatch = Partial<Record<(typeof URL_KEYS)[number], string | null>>;

/**
 * Builds a shop URL from the current params plus a patch.
 * Any change other than paging resets to page 1.
 */
export function buildShopHref(
  pathname: string,
  current: URLSearchParams | RawSearchParams,
  patch: UrlPatch,
): string {
  const params = new URLSearchParams();

  for (const key of URL_KEYS) {
    const existing =
      current instanceof URLSearchParams
        ? current.get(key) ?? undefined
        : first((current as RawSearchParams)[key]);
    if (existing) params.set(key, existing);
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === "") params.delete(key);
    else params.set(key, value);
  }

  if (!("page" in patch)) params.delete("page");
  if (params.get("page") === "1") params.delete("page");
  if (params.get("sort") === "newest") params.delete("sort");

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/** Human-readable summary of what is filtered, for the results header. */
export function describeQuery(query: ProductQuery): string[] {
  const parts: string[] = [];
  if (query.q) parts.push(`“${query.q}”`);
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    const min = query.minPrice !== undefined ? `$${query.minPrice}` : "";
    const max = query.maxPrice !== undefined ? `$${query.maxPrice}` : "";
    parts.push(min && max ? `${min}–${max}` : min ? `from ${min}` : `up to ${max}`);
  }
  return parts;
}
