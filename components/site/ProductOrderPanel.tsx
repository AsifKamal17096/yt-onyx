"use client";

import { useState } from "react";
import { HelpCircle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InquiryButton } from "@/components/inquiry/InquiryButton";
import { logInquiry } from "@/lib/log-inquiry";
import { WhatsAppIcon } from "@/components/ui/icons";
import { formatPriceAmount, formatPrice } from "@/lib/format";
import {
  buildWhatsAppUrl,
  renderWhatsAppTemplate,
} from "@/lib/whatsapp";

export type OrderPanelProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  priceCents: number;
  thumbUrl: string | null;
  availability: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK";
};

/**
 * Quantity + WhatsApp actions.
 *
 * The message has to be built in the browser because it includes the quantity
 * the visitor picked, so the number and the template are passed down from the
 * server (both are public values; the admin edits them in site settings).
 */
export function ProductOrderPanel({
  product,
  whatsappNumber,
  template,
  productUrl,
}: {
  product: OrderPanelProduct;
  whatsappNumber: string | null;
  template: string;
  productUrl: string;
}) {
  const [quantity, setQuantity] = useState(1);

  const orderMessage = renderWhatsAppTemplate(template, {
    name: product.name,
    sku: product.sku,
    price: formatPriceAmount(product.priceCents),
    qty: quantity,
    url: productUrl,
  });

  const questionMessage = `Hello YT Onyx! I have a question about ${product.name} (SKU ${product.sku}).\nLink: ${productUrl}`;

  const orderHref = buildWhatsAppUrl(whatsappNumber, orderMessage);
  const questionHref = buildWhatsAppUrl(whatsappNumber, questionMessage);
  const external = orderHref.startsWith("http");
  const soldOut = product.availability === "OUT_OF_STOCK";

  return (
    <div className="mt-8 border-t border-line pt-8">
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center border border-line">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-cream-dim disabled:opacity-35"
          >
            <Minus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <input
            type="number"
            min={1}
            max={999}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              setQuantity(Number.isFinite(next) ? Math.min(999, Math.max(1, Math.round(next))) : 1);
            }}
            aria-label="Quantity"
            className="h-11 w-14 border-x border-line bg-transparent text-center text-sm outline-none [appearance:textfield] focus:bg-cream-dim/50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(999, value + 1))}
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center text-ink transition-colors hover:bg-cream-dim"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        {quantity > 1 ? (
          <p className="text-sm text-muted">
            Subtotal{" "}
            <span className="font-medium text-ink">
              {formatPrice(product.priceCents * quantity)}
            </span>
            <span className="ml-1 text-xs">(before shipping)</span>
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Button
          href={orderHref}
          variant="whatsapp"
          size="lg"
          fullWidth
          external={external}
          onClick={() =>
            logInquiry("PRODUCT", [{ productId: product.id, quantity }])
          }
        >
          <WhatsAppIcon className="h-4 w-4" />
          {soldOut ? "Ask about availability" : "Order on WhatsApp"}
        </Button>

        <InquiryButton
          product={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            sku: product.sku,
            priceCents: product.priceCents,
            thumbUrl: product.thumbUrl,
          }}
          quantity={quantity}
        />

        <Button
          href={questionHref}
          variant="outline"
          fullWidth
          external={external}
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
          Ask a question
        </Button>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Adding to the list lets you send several pieces in one message.
      </p>

      {!whatsappNumber ? (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          WhatsApp is not connected yet — these buttons open our contact page.
        </p>
      ) : null}
    </div>
  );
}
