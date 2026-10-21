import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronRight, Info, Truck } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductOrderPanel } from "@/components/site/ProductOrderPanel";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Skeleton } from "@/components/ui/Skeleton";
import { absoluteUrl, BRAND } from "@/lib/brand";
import {
  getProductBySlug,
  getPublishedProductSlugs,
  getRelatedProducts,
} from "@/lib/catalog";
import {
  availabilityLabel,
  discountPercent,
  formatDimensions,
  formatPrice,
  formatWeight,
} from "@/lib/format";
import { breadcrumbSchema, productSchema } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { mediaUrl, ogImageUrl } from "@/lib/storage";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

/**
 * Prerenders the most recent products at build time; anything else is rendered
 * on first visit and then cached (ISR). `generateStaticParams` must return at
 * least one entry under Cache Components, hence the sentinel for an empty shop.
 */
export async function generateStaticParams() {
  const products = await getPublishedProductSlugs();
  if (products.length === 0) return [{ slug: "no-products-yet" }];
  return products.slice(0, 24).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(
  props: PageProps<"/product/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: "Product not found", robots: { index: false } };
  }

  const image = product.images[0];
  const canonical = `/product/${product.slug}`;

  return {
    // A custom SEO title is used verbatim; a plain product name still gets the
    // "| YT Onyx" suffix from the root template.
    title: product.seoTitle ? { absolute: product.seoTitle } : product.name,
    description: product.seoDescription || product.shortDescription,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.seoTitle || `${product.name} — ${BRAND.name}`,
      description: product.seoDescription || product.shortDescription,
      url: canonical,
      // A JPEG rendition at 1200x630: WhatsApp and other crawlers handle it
      // far more reliably than the stored WebP.
      images: image
        ? [
            {
              url: absoluteUrl(ogImageUrl(image.fileKey)!),
              width: 1200,
              height: 630,
              alt: image.alt || product.name,
            },
          ]
        : undefined,
    },
  };
}

export default function ProductPage(props: PageProps<"/product/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={props.params} />
    </Suspense>
  );
}

async function ProductView({
  params,
}: Pick<PageProps<"/product/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [settings, related] = await Promise.all([
    getSiteSettings(),
    getRelatedProducts(product.category.id, product.id, 4),
  ]);

  const saving = discountPercent(product.priceCents, product.compareAtCents);
  const dimensions = formatDimensions(product);
  const weight = formatWeight(product.weight, product.weightUnit);

  const specs = [
    { label: "SKU", value: product.sku },
    { label: "Stone", value: product.stoneType?.name },
    { label: "Colour", value: product.color?.name },
    { label: "Finish", value: product.finish?.name },
    { label: "Dimensions", value: dimensions },
    { label: "Weight", value: weight },
    { label: "Availability", value: availabilityLabel(product.availability) },
  ].filter((spec): spec is { label: string; value: string } =>
    Boolean(spec.value),
  );

  const galleryImages = product.images.map((image) => ({
    id: image.id,
    src: mediaUrl(image.fileKey)!,
    thumb: mediaUrl(image.thumbKey)!,
    alt: image.alt,
    width: image.width,
    height: image.height,
    blurDataUrl: image.blurDataUrl,
  }));

  return (
    <>
      <JsonLd data={productSchema(product)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: product.category.name, path: `/category/${product.category.slug}` },
          { name: product.name, path: `/product/${product.slug}` },
        ])}
      />

      <nav aria-label="Breadcrumb" className="container-page pt-8">
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
          <li>
            <Link
              href={`/category/${product.category.slug}`}
              className="transition-colors hover:text-ink"
            >
              {product.category.name}
            </Link>
          </li>
          <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <article className="container-page grid gap-12 py-10 lg:grid-cols-2 lg:gap-16 lg:py-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={galleryImages} productName={product.name} />
        </div>

        <div>
          <p className="eyebrow text-gold-deep">
            {product.stoneType?.name ?? product.category.name}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
            {product.name}
          </h1>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <p className="font-sans text-2xl text-ink">
              {formatPrice(product.priceCents)}
            </p>
            {product.compareAtCents &&
            product.compareAtCents > product.priceCents ? (
              <>
                <p className="text-sm text-muted line-through">
                  {formatPrice(product.compareAtCents)}
                </p>
                {saving ? (
                  <span className="bg-gold px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-ink">
                    Save {saving}%
                  </span>
                ) : null}
              </>
            ) : null}
            <span className="text-xs uppercase tracking-[0.16em] text-muted">
              USD
            </span>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted">
            {product.shortDescription}
          </p>

          <ProductOrderPanel
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              sku: product.sku,
              priceCents: product.priceCents,
              thumbUrl: mediaUrl(product.images[0]?.thumbKey),
              availability: product.availability,
            }}
            whatsappNumber={normalizeWhatsAppNumber(settings.whatsappNumber)}
            template={settings.whatsappTemplate}
            productUrl={absoluteUrl(`/product/${product.slug}`)}
          />

          <p className="mt-5 flex items-start gap-2.5 bg-cream-dim/60 p-4 text-xs leading-relaxed text-muted">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" strokeWidth={1.5} />
            Shipping cost is calculated for your country and shared on WhatsApp.
            Every piece is crated by hand before dispatch.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-8 text-sm">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="text-[0.64rem] uppercase tracking-[0.16em] text-muted">
                  {spec.label}
                </dt>
                <dd className="mt-1 text-ink">{spec.value}</dd>
              </div>
            ))}
          </dl>

          <section className="mt-10 border-t border-line pt-8">
            <h2 className="font-serif text-2xl">About this piece</h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted">
              {product.description.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          {product.careInstructions ? (
            <section className="mt-10 border-t border-line pt-8">
              <h2 className="flex items-center gap-2 font-serif text-2xl">
                <Info className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
                Care
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                {product.careInstructions}
              </p>
            </section>
          ) : null}
        </div>
      </article>

      {related.length > 0 ? (
        <section className="border-t border-line bg-cream-dim/40 py-16 sm:py-20">
          <div className="container-page">
            <SectionHeading
              eyebrow="You may also like"
              title={`More from ${product.category.name}`}
              href={`/category/${product.category.slug}`}
              linkLabel="View category"
            />
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="container-page grid gap-12 py-14 lg:grid-cols-2 lg:gap-16">
      <Skeleton className="aspect-square w-full" />
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-4 h-10 w-3/4" />
        <Skeleton className="mt-5 h-7 w-32" />
        <Skeleton className="mt-6 h-16 w-full" />
        <Skeleton className="mt-8 h-12 w-full" />
        <Skeleton className="mt-3 h-11 w-full" />
      </div>
    </div>
  );
}
