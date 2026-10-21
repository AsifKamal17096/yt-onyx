"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardList, Minus, Plus, Trash2, X } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { WhatsAppIcon } from "@/components/ui/icons";
import { buildInquiryListMessage } from "@/lib/inquiry-message";
import {
  clearList,
  refreshList,
  removeItem,
  setQuantity,
  subtotalCents,
  useInquiryList,
} from "@/lib/inquiry-store";
import { logInquiry } from "@/lib/log-inquiry";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

/**
 * Header badge plus the slide-out inquiry list.
 *
 * The list is a reference tool, not a cart: it shows an items subtotal and
 * sends everything in one WhatsApp message. No totals are ever presented as a
 * final price, because shipping is quoted per country afterwards.
 */
export function InquiryDrawer({
  whatsappNumber,
  siteUrl,
}: {
  whatsappNumber: string | null;
  siteUrl: string;
}) {
  const items = useInquiryList();
  const [open, setOpen] = useState(false);

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = subtotalCents(items);

  // Opening the drawer refreshes prices and removes anything unpublished.
  useEffect(() => {
    if (!open) return;
    void refreshList();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const message = buildInquiryListMessage(items, siteUrl);
  const whatsappHref = buildWhatsAppUrl(whatsappNumber, message);
  const external = whatsappHref.startsWith("http");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-gold-deep"
        aria-label={
          count > 0
            ? `Inquiry list, ${count} ${count === 1 ? "item" : "items"}`
            : "Inquiry list, empty"
        }
      >
        <ClipboardList className="h-5 w-5" strokeWidth={1.4} />
        {count > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[0.6rem] font-medium text-ink">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      <Portal>
        <div
          className={cn(
            "fixed inset-0 z-50",
            open ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!open}
        >
        <div
          className={cn(
            "absolute inset-0 bg-ink/50 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <aside
          role="dialog"
          aria-modal={open}
          aria-label="Inquiry list"
          className={cn(
            "absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream transition-transform duration-300 ease-[var(--ease-brand)]",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <header className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="font-serif text-2xl">Your inquiry list</h2>
              <p className="mt-1 text-[0.66rem] uppercase tracking-[0.16em] text-muted">
                {count} {count === 1 ? "piece" : "pieces"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close inquiry list"
              className="p-1 text-ink transition-colors hover:text-gold-deep"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </header>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <ClipboardList className="h-8 w-8 text-muted" strokeWidth={1.1} />
              <p className="mt-5 font-serif text-xl">Nothing on your list yet</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Add the pieces you are considering and send them to us in one
                WhatsApp message. We reply with availability and shipping.
              </p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-7 inline-flex h-11 items-center justify-center rounded-xs bg-ink px-6 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-colors hover:bg-ink-soft"
              >
                Browse the collection
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-4 py-5">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="relative h-24 w-20 shrink-0 overflow-hidden bg-cream-dim"
                    >
                      {item.thumbUrl ? (
                        <Image
                          src={item.thumbUrl}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : null}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => setOpen(false)}
                        className="font-serif text-lg leading-snug transition-colors hover:text-gold-deep"
                      >
                        {item.name}
                      </Link>
                      <p className="mt-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-muted">
                        {item.sku}
                      </p>
                      <p className="mt-1.5 text-sm">
                        {formatPrice(item.priceCents)}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center border border-line">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.productId, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-cream-dim disabled:opacity-35"
                          >
                            <Minus className="h-3 w-3" strokeWidth={2} />
                          </button>
                          <span className="w-9 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.productId, item.quantity + 1)
                            }
                            aria-label={`Increase quantity of ${item.name}`}
                            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-cream-dim"
                          >
                            <Plus className="h-3 w-3" strokeWidth={2} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          aria-label={`Remove ${item.name} from your inquiry list`}
                          className="p-1.5 text-muted transition-colors hover:text-ink"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={1.4} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <footer className="border-t border-line px-6 py-5">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-muted">Items subtotal</span>
                  <span className="font-sans text-lg">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  For reference only. Shipping to your country is quoted on
                  WhatsApp before anything is confirmed.
                </p>

                <a
                  href={whatsappHref}
                  target={external ? "_blank" : undefined}
                  rel={external ? "noopener noreferrer" : undefined}
                  onClick={() => {
                    logInquiry(
                      "INQUIRY_LIST",
                      items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                      })),
                    );
                    setOpen(false);
                  }}
                  className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xs bg-[#1f7a55] text-[0.78rem] font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#17603f]"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  Send list on WhatsApp
                </a>

                <button
                  type="button"
                  onClick={clearList}
                  className="mt-3 w-full py-2 text-[0.66rem] uppercase tracking-[0.16em] text-muted underline underline-offset-4 transition-colors hover:text-ink"
                >
                  Clear list
                </button>
              </footer>
            </>
          )}
          </aside>
        </div>
      </Portal>
    </>
  );
}
