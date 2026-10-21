/**
 * Shop query vocabulary shared by the server queries and the client filter UI.
 *
 * This module is deliberately free of database imports so client components can
 * use it without pulling Prisma into the browser bundle.
 */

export const SORT_OPTIONS = {
  newest: "Newest",
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export type ProductQuery = {
  q?: string;
  category?: string;
  stone?: string;
  color?: string;
  finish?: string;
  /** Inclusive price bounds in whole dollars, as typed in the filter rail. */
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
  page?: number;
  perPage?: number;
};
