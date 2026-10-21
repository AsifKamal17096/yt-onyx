import Image from "next/image";
import Link from "next/link";
import { InquiryButton } from "@/components/inquiry/InquiryButton";
import type { ProductCardData } from "@/lib/catalog";
import { availabilityLabel, discountPercent, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/storage";

/**
 * Product tile used across the shop, category pages and home page.
 * The price is always visible — there is no hidden pricing on this site.
 *
 * The add-to-list button is a sibling of the link rather than a child, since
 * a button inside an anchor is invalid markup and breaks keyboard users.
 */
export function ProductCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardData;
  /** Set on the first row so the hero image of a listing loads eagerly. */
  priority?: boolean;
  className?: string;
}) {
  const [primary, secondary] = product.images;
  const primarySrc = mediaUrl(primary?.fileKey);
  const secondarySrc = mediaUrl(secondary?.fileKey);
  const saving = discountPercent(product.priceCents, product.compareAtCents);

  return (
    <article className={cn("group relative", className)}>
      <InquiryButton
        variant="card"
        product={{
          productId: product.id,
          slug: product.slug,
          name: product.name,
          sku: product.sku,
          priceCents: product.priceCents,
          thumbUrl: mediaUrl(primary?.thumbKey),
        }}
      />

      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-none"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-cream-dim">
          {primarySrc ? (
            <>
              <Image
                src={primarySrc}
                alt={primary?.alt || product.name}
                fill
                sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
                placeholder={primary?.blurDataUrl ? "blur" : undefined}
                blurDataURL={primary?.blurDataUrl || undefined}
                priority={priority}
                className={cn(
                  "object-cover transition-all duration-700 ease-[var(--ease-brand)]",
                  secondarySrc
                    ? "group-hover:opacity-0"
                    : "group-hover:scale-[1.04]",
                )}
              />
              {/* Second photograph fades in on hover — no layout shift. */}
              {secondarySrc ? (
                <Image
                  src={secondarySrc}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover opacity-0 transition-opacity duration-700 ease-[var(--ease-brand)] group-hover:opacity-100"
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.2em] text-muted">
              No image
            </div>
          )}

          {saving ? (
            <span className="absolute left-3 top-3 bg-gold px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink">
              Save {saving}%
            </span>
          ) : null}

          {product.availability === "OUT_OF_STOCK" ? (
            <span className="absolute bottom-3 left-3 bg-ink/85 px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-[0.18em] text-cream">
              {availabilityLabel(product.availability)}
            </span>
          ) : null}
        </div>

        <div className="pt-4">
          <p className="eyebrow text-muted">
            {product.stoneType?.name ?? product.category.name}
          </p>
          <h3 className="mt-1.5 font-serif text-xl leading-snug text-ink transition-colors duration-300 group-hover:text-gold-deep">
            {product.name}
          </h3>
          <p className="mt-2 flex items-baseline gap-2 font-sans text-sm text-ink">
            <span className="font-medium">{formatPrice(product.priceCents)}</span>
            {product.compareAtCents &&
            product.compareAtCents > product.priceCents ? (
              <span className="text-xs text-muted line-through">
                {formatPrice(product.compareAtCents)}
              </span>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
