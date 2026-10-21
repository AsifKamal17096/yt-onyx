import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { Pagination } from "@/components/site/Pagination";
import { ProductCard } from "@/components/site/ProductCard";
import { ShopControls } from "@/components/site/ShopControls";
import { EmptyResults } from "@/components/site/EmptyResults";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import {
  getCategoryBySlug,
  getCategorySlugs,
  getFilterOptions,
  searchProducts,
} from "@/lib/catalog";
import { breadcrumbSchema, collectionSchema } from "@/lib/seo";
import { parseProductQuery, type RawSearchParams } from "@/lib/shop-params";

export async function generateStaticParams() {
  const categories = await getCategorySlugs();
  if (categories.length === 0) return [{ slug: "home-decor" }];
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata(
  props: PageProps<"/category/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found", robots: { index: false } };
  }

  return {
    // A custom SEO title is used verbatim; the plain name keeps the template.
    title: category.seoTitle ? { absolute: category.seoTitle } : category.name,
    description: category.seoDescription || category.description || undefined,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: category.seoTitle || category.name,
      description: category.seoDescription || category.description || undefined,
      url: `/category/${category.slug}`,
    },
  };
}

export default function CategoryPage(props: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<CategorySkeleton />}>
      <CategoryView params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function CategoryView({
  params,
  searchParams,
}: PageProps<"/category/[slug]">) {
  const [{ slug }, rawParams] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  const urlParams = rawParams as RawSearchParams;
  const query = parseProductQuery(urlParams, { category: slug });

  const [options, results] = await Promise.all([
    getFilterOptions(),
    searchProducts(query),
  ]);

  return (
    <>
      <JsonLd data={collectionSchema(category)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: category.name, path: `/category/${category.slug}` },
        ])}
      />

      <header className="border-b border-line bg-cream-dim/40">
        <div className="container-page py-12 sm:py-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[0.66rem] uppercase tracking-[0.16em] text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              <li>
                <Link href="/shop" className="transition-colors hover:text-ink">
                  Shop
                </Link>
              </li>
              <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              <li aria-current="page" className="text-ink">
                {category.name}
              </li>
            </ol>
          </nav>

          <h1 className="mt-5 font-serif text-4xl sm:text-5xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
              {category.description}
            </p>
          ) : null}
        </div>
      </header>

      <div className="container-page py-12">
        <ShopControls
          options={options}
          total={results.total}
          lockedCategory={slug}
        />

        <div className="mt-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <ShopControls
              options={options}
              total={results.total}
              lockedCategory={slug}
              variant="rail"
            />
          </aside>

          <section>
            {results.items.length === 0 ? (
              <EmptyResults />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
                  {results.items.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      priority={index < 3}
                    />
                  ))}
                </div>
                <Pagination
                  page={results.page}
                  pageCount={results.pageCount}
                  pathname={`/category/${slug}`}
                  searchParams={urlParams}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function CategorySkeleton() {
  return (
    <>
      <div className="border-b border-line bg-cream-dim/40">
        <div className="container-page py-12 sm:py-16">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-5 h-12 w-80 max-w-full" />
          <Skeleton className="mt-5 h-10 w-full max-w-2xl" />
        </div>
      </div>
      <div className="container-page py-12">
        <Skeleton className="h-11 w-full" />
        <div className="mt-10">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </>
  );
}
