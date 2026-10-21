import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  SORT_OPTIONS,
  type ProductQuery,
  type SortKey,
} from "@/lib/product-query";
import { prisma } from "@/lib/prisma";

/**
 * Public catalogue reads.
 *
 * Every function here is cached with `use cache` and tagged, so pages
 * prerender as static shells and admin writes revalidate them on demand
 * (lib/revalidate.ts). These queries only ever return published products —
 * drafts never reach a public page.
 */

/** Columns a product card needs, kept narrow so cache entries stay small. */
const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  priceCents: true,
  compareAtCents: true,
  availability: true,
  featured: true,
  shortDescription: true,
  category: { select: { name: true, slug: true } },
  stoneType: { select: { name: true, slug: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    take: 2,
    select: {
      fileKey: true,
      thumbKey: true,
      width: true,
      height: true,
      blurDataUrl: true,
      alt: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Awaited<
  ReturnType<typeof getFeaturedProducts>
>[number];

export type ProductDetail = NonNullable<
  Awaited<ReturnType<typeof getProductBySlug>>
>;

export async function getFeaturedProducts(limit = 6) {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("max");

  return prisma.product.findMany({
    where: { published: true, featured: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
}

export async function getLatestProducts(limit = 8) {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("max");

  return prisma.product.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
}

/** Categories with a live count of published products, for the home grid. */
export async function getCategoriesWithCounts() {
  "use cache";
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.products);
  cacheLife("max");

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageKey: true,
      _count: { select: { products: { where: { published: true } } } },
    },
  });

  return categories.map((category) => ({
    ...category,
    productCount: category._count.products,
  }));
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.category(slug));
  cacheLife("max");

  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageKey: true,
      seoTitle: true,
      seoDescription: true,
    },
  });
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.product(slug));
  cacheLife("max");

  return prisma.product.findFirst({
    where: { slug, published: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      priceCents: true,
      compareAtCents: true,
      availability: true,
      shortDescription: true,
      description: true,
      careInstructions: true,
      length: true,
      width: true,
      height: true,
      dimensionUnit: true,
      weight: true,
      weightUnit: true,
      seoTitle: true,
      seoDescription: true,
      createdAt: true,
      category: { select: { id: true, name: true, slug: true } },
      stoneType: { select: { name: true, slug: true } },
      color: { select: { name: true, slug: true } },
      finish: { select: { name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        select: {
          id: true,
          fileKey: true,
          thumbKey: true,
          width: true,
          height: true,
          blurDataUrl: true,
          alt: true,
        },
      },
    },
  });
}

export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  limit = 4,
) {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("max");

  return prisma.product.findMany({
    where: {
      published: true,
      categoryId,
      NOT: { id: excludeProductId },
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: limit,
    select: productCardSelect,
  });
}

/** Everything the shop filter rail needs, in one cached read. */
export async function getFilterOptions() {
  "use cache";
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.attributes, CACHE_TAGS.products);
  cacheLife("max");

  const [categories, stoneTypes, colors, finishes, priceRange] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true },
      }),
      prisma.stoneType.findMany({
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true },
      }),
      prisma.color.findMany({
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true, hex: true },
      }),
      prisma.finish.findMany({
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true },
      }),
      prisma.product.aggregate({
        where: { published: true },
        _min: { priceCents: true },
        _max: { priceCents: true },
      }),
    ]);

  return {
    categories,
    stoneTypes,
    colors,
    finishes,
    minPriceCents: priceRange._min.priceCents ?? 0,
    maxPriceCents: priceRange._max.priceCents ?? 0,
  };
}

export { SORT_OPTIONS };
export type { ProductQuery, SortKey };

const ORDER_BY: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  newest: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  featured: [{ featured: "desc" }, { publishedAt: "desc" }],
  "price-asc": [{ priceCents: "asc" }],
  "price-desc": [{ priceCents: "desc" }],
};

/**
 * The shop query. Arguments are plain values, so each filter combination gets
 * its own cache entry and repeat visits are served from the cache.
 */
export async function searchProducts(query: ProductQuery) {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("max");

  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(48, Math.max(6, query.perPage ?? 12));
  const sort: SortKey =
    query.sort && query.sort in ORDER_BY ? query.sort : "newest";

  const where: Prisma.ProductWhereInput = { published: true };

  if (query.category) where.category = { slug: query.category };
  if (query.stone) where.stoneType = { slug: query.stone };
  if (query.color) where.color = { slug: query.color };
  if (query.finish) where.finish = { slug: query.finish };

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.priceCents = {
      ...(query.minPrice !== undefined
        ? { gte: Math.round(query.minPrice * 100) }
        : {}),
      ...(query.maxPrice !== undefined
        ? { lte: Math.round(query.maxPrice * 100) }
        : {}),
    };
  }

  if (query.q) {
    // PostgreSQL's LIKE is case-sensitive, hence the explicit mode.
    const term = query.q.trim();
    const insensitive = { contains: term, mode: "insensitive" } as const;
    where.OR = [
      { name: insensitive },
      { sku: insensitive },
      { shortDescription: insensitive },
      { description: insensitive },
      { stoneType: { name: insensitive } },
      { category: { name: insensitive } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * perPage,
      take: perPage,
      select: productCardSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Slugs for generateStaticParams and the sitemap. */
export async function getPublishedProductSlugs() {
  "use cache";
  cacheTag(CACHE_TAGS.products);
  cacheLife("max");

  return prisma.product.findMany({
    where: { published: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: { slug: true, updatedAt: true },
  });
}

export async function getCategorySlugs() {
  "use cache";
  cacheTag(CACHE_TAGS.categories);
  cacheLife("max");

  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true, updatedAt: true },
  });
}
