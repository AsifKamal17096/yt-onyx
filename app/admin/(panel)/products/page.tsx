import type { Metadata } from "next";
import { Search } from "lucide-react";
import { AdminLinkButton, AdminPage, EmptyState } from "@/components/admin/PageShell";
import { ProductsTable, type ProductRow } from "@/components/admin/ProductsTable";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { formatDate } from "@/lib/format";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Products" };

const PER_PAGE = 50;

export default async function ProductsAdminPage(
  props: PageProps<"/admin/products">,
) {
  await requireAdminPage();

  const params = await props.searchParams;
  const read = (key: string) => {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    return first?.trim() || "";
  };

  const q = read("q");
  const category = read("category");
  const status = read("status");
  const page = Math.max(1, Number(read("page")) || 1);

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    const insensitive = { contains: q, mode: "insensitive" } as const;
    where.OR = [
      { name: insensitive },
      { sku: insensitive },
      { shortDescription: insensitive },
    ];
  }
  if (category) where.category = { slug: category };
  if (status === "published") where.published = true;
  if (status === "draft") where.published = false;
  if (status === "featured") where.featured = true;
  if (status === "demo") where.isDemo = true;

  const [csrf, categories, total, products] = await Promise.all([
    csrfToken(),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true },
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        sku: true,
        slug: true,
        priceCents: true,
        published: true,
        featured: true,
        isDemo: true,
        updatedAt: true,
        category: { select: { name: true } },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
          take: 1,
          select: { thumbKey: true },
        },
      },
    }),
  ]);

  const rows: ProductRow[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    slug: product.slug,
    priceCents: product.priceCents,
    published: product.published,
    featured: product.featured,
    isDemo: product.isDemo,
    categoryName: product.category.name,
    thumbUrl: mediaUrl(product.images[0]?.thumbKey),
    updatedAt: formatDate(product.updatedAt),
  }));

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <AdminPage
      title="Products"
      description={`${total} product${total === 1 ? "" : "s"} in the catalogue.`}
      actions={
        <AdminLinkButton href={`${ADMIN_BASE}/products/new`}>
          New product
        </AdminLinkButton>
      }
    >
      <form
        method="get"
        className="flex flex-col gap-3 border border-line bg-white p-4 sm:flex-row sm:items-end"
      >
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search by name or SKU"
            className="w-full border border-line bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gold"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            Category
          </span>
          <select
            name="category"
            defaultValue={category}
            className="border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="">All</option>
            {categories.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            Status
          </span>
          <select
            name="status"
            defaultValue={status}
            className="border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="featured">Featured</option>
            <option value="demo">Demo data</option>
          </select>
        </label>

        <button
          type="submit"
          className="h-11 rounded-xs bg-ink px-5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-ink-soft"
        >
          Filter
        </button>
      </form>

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState
            title="No products match"
            body={
              q || category || status
                ? "Try a different search or clear the filters."
                : "Add your first piece and it will appear here."
            }
            action={
              <AdminLinkButton href={`${ADMIN_BASE}/products/new`}>
                New product
              </AdminLinkButton>
            }
          />
        ) : (
          <>
            <ProductsTable rows={rows} csrf={csrf} />

            {pageCount > 1 ? (
              <nav className="mt-5 flex items-center justify-center gap-2 text-xs">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (candidate) => {
                    const search = new URLSearchParams();
                    if (q) search.set("q", q);
                    if (category) search.set("category", category);
                    if (status) search.set("status", status);
                    if (candidate > 1) search.set("page", String(candidate));
                    const query = search.toString();

                    return (
                      <a
                        key={candidate}
                        href={`${ADMIN_BASE}/products${query ? `?${query}` : ""}`}
                        aria-current={candidate === page ? "page" : undefined}
                        className={`flex h-8 min-w-8 items-center justify-center border px-2 ${
                          candidate === page
                            ? "border-ink bg-ink text-cream"
                            : "border-line text-muted hover:border-ink hover:text-ink"
                        }`}
                      >
                        {candidate}
                      </a>
                    );
                  },
                )}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </AdminPage>
  );
}
