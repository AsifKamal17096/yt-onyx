"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { cn } from "@/lib/cn";

export const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/custom-orders", label: "Custom & Bulk" },
  { href: "/about", label: "Our Story" },
  { href: "/shipping", label: "Shipping" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

const LINK_BASE =
  "relative text-[0.72rem] uppercase tracking-[0.2em] transition-colors duration-300 hover:text-gold-deep";

/**
 * Desktop navigation. Reads the pathname to mark the current section, which is
 * why it is a client component and why the header renders it inside Suspense.
 */
export function NavLinks() {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-7">
      {NAV_LINKS.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                LINK_BASE,
                active ? "text-ink" : "text-muted",
                "after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-gold after:transition-all after:duration-300",
                active ? "after:w-full" : "after:w-0 hover:after:w-full",
              )}
            >
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Same markup without the active state, used as the Suspense fallback. */
export function NavLinksFallback() {
  return (
    <ul className="flex items-center gap-7">
      {NAV_LINKS.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className={cn(LINK_BASE, "text-muted")}>
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Slide-in navigation for phones.
 *
 * The panel is portalled to <body>: the header sets `backdrop-filter`, which
 * would otherwise make it the containing block for this fixed overlay and clip
 * the drawer to the height of the header.
 */
export function MobileNav({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname();
  // The panel remembers which route it was opened on, so any navigation
  // closes it without needing an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);

  // Lock body scroll while the panel is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenedOn(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="-ml-2 p-2 text-ink transition-colors hover:text-gold-deep lg:hidden"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <Portal>
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            open ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!open}
        >
          <div
            className={cn(
              "absolute inset-0 bg-ink/60 transition-opacity duration-300",
              open ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setOpen(false)}
          />

          <nav
            // Distinct from the desktop nav, which also labels itself "Main".
            aria-label="Mobile"
            className={cn(
              "absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col bg-cream shadow-[0_0_60px_-10px_rgba(10,10,10,0.5)] transition-transform duration-300 ease-[var(--ease-brand)]",
              open ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <span className="eyebrow text-muted">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="-mr-1 p-1 text-ink transition-colors hover:text-gold-deep"
              >
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>

            <ul className="flex-1 overflow-y-auto px-6 py-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block border-b border-line/60 py-4 font-serif text-2xl text-ink transition-colors hover:text-gold-deep"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="border-t border-line px-6 py-5">{children}</div>
          </nav>
        </div>
      </Portal>
    </>
  );
}
