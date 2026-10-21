"use client";

import { Check, Plus } from "lucide-react";
import { addItem, removeItem, useIsInList } from "@/lib/inquiry-store";
import { cn } from "@/lib/cn";

export type InquiryButtonProduct = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  priceCents: number;
  thumbUrl: string | null;
};

/**
 * Adds a piece to (or removes it from) the inquiry list.
 *
 * "card" is the compact overlay used on product tiles; "detail" is the full
 * width button on a product page.
 */
export function InquiryButton({
  product,
  quantity = 1,
  variant = "detail",
  className,
}: {
  product: InquiryButtonProduct;
  quantity?: number;
  variant?: "card" | "detail";
  className?: string;
}) {
  const inList = useIsInList(product.productId);

  const toggle = () => {
    if (inList) removeItem(product.productId);
    else addItem(product, quantity);
  };

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={inList}
        aria-label={
          inList
            ? `Remove ${product.name} from your inquiry list`
            : `Add ${product.name} to your inquiry list`
        }
        className={cn(
          "absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center border transition-all duration-300",
          inList
            ? "border-ink bg-ink text-cream"
            : "border-line bg-cream/90 text-ink hover:border-ink lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100",
          className,
        )}
      >
        {inList ? (
          <Check className="h-4 w-4" strokeWidth={2} />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={1.8} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={inList}
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xs border text-[0.78rem] font-medium uppercase tracking-[0.18em] transition-all duration-300",
        inList
          ? "border-ink bg-ink text-cream"
          : "border-line-strong text-ink hover:border-ink",
        className,
      )}
    >
      {inList ? (
        <>
          <Check className="h-4 w-4" strokeWidth={2} />
          In your inquiry list
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          Add to inquiry list
        </>
      )}
    </button>
  );
}
