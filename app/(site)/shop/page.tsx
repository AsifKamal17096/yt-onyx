import { Suspense } from "react";
import type { Metadata } from "next";
import { Pagination } from "@/components/site/Pagination";
import { ProductCard } from "@/components/site/ProductCard";
import { ShopControls } from "@/components/site/ShopControls";
import { EmptyResults } from "@/components/site/EmptyResults";
import { ProductGridSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { getFilterOptions, searchProducts } from "@/lib/catalog";
import { parseProductQuery, type RawSearchParams } from "@/lib/shop-params";

export const metadata: Metadata = {
  title: "Shop the collection",
  description:
    "Browse every onyx and marble piece in the YT Onyx workshop: lamps, tableware, basins, furniture, slabs and gifts, each with its price in USD.",
  alternates: { canonical: "/shop" },
};

/**
 * The static shell (heading) prerenders; the results read `searchParams`, so
 * they live inside a Suspense boundary and stream in per filter combination.
 */
export default function ShopPage(props: PageProps<"/shop">) {
  return (
    <>
      <header className="border-b border-line bg-cream-dim/40">
        <div className="container-page py-14 sm:py-16">
          <p className="eyebrow text-gold-deep">The collection</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
            Every piece, with its price
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            Filter by stone, colour, finish or budget. When something fits, send
            it to us on WhatsApp and we will confirm availability and the cost of
            shipping it to your country.
          </p>
        </div>
      </header>

      <div className="container-page py-12">
        <Suspense fallback={<ShopSkeleton />}>
          <ShopResults searchParams={props.searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function ShopResults({
  searchParams,
}: Pick<PageProps<"/shop">, "searchParams">) {
  const params = (await searchParams) as RawSearchParams;
  const query = parseProductQuery(params);

  const [options, results] = await Promise.all([
    getFilterOptions(),
    searchProducts(query),
  ]);

  return (
    <>
      <ShopControls options={options} total={results.total} />

      <div className="mt-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <ShopControls
            options={options}
            total={results.total}
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
                pathname="/shop"
                searchParams={params}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}

function ShopSkeleton() {
  return (
    <>
      <Skeleton className="h-11 w-full" />
      <div className="mt-10 lg:grid lg:grid-cols-[220px_1fr] lg:gap-14">
        <div className="hidden space-y-8 lg:block">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-3 w-24" />
              <div className="mt-4 space-y-2.5">
                {Array.from({ length: 5 }).map((__, row) => (
                  <Skeleton key={row} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <ProductGridSkeleton count={9} />
      </div>
    </>
  );
}
