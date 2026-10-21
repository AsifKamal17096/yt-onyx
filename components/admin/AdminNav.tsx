"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  Download,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  MessageSquare,
  Quote,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { useAdminPath } from "@/components/admin/AdminPathProvider";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { logoutAction } from "@/app/admin/_actions/auth";
import { cn } from "@/lib/cn";

const LINKS: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/products", label: "Products", Icon: Boxes },
  { href: "/categories", label: "Categories", Icon: Tags },
  { href: "/attributes", label: "Attributes", Icon: ImageIcon },
  { href: "/testimonials", label: "Testimonials", Icon: Quote },
  { href: "/inquiries", label: "Inquiries", Icon: MessageSquare },
  { href: "/settings", label: "Site settings", Icon: Settings },
  { href: "/password", label: "Password", Icon: KeyRound },
  { href: "/backup", label: "Backup", Icon: Download },
];

export function AdminNav({ csrf }: { csrf: string }) {
  const adminUrl = useAdminPath();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const body = (
    <>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {LINKS.map(({ href, label, Icon }) => {
          const target = adminUrl(href);
          const active =
            href === ""
              ? pathname === target
              : pathname === target || pathname.startsWith(`${target}/`);

          return (
            <Link
              key={label}
              href={target}
              onClick={() => setOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[0.72rem] uppercase tracking-[0.14em] transition-colors",
                active
                  ? "bg-cream/10 text-cream"
                  : "text-cream/55 hover:bg-cream/5 hover:text-cream",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-cream/10 px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 text-[0.72rem] uppercase tracking-[0.14em] text-cream/55 transition-colors hover:text-cream"
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
          View site
        </a>
        <form action={logoutAction}>
          <input type="hidden" name={CSRF_FIELD} value={csrf} />
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[0.72rem] uppercase tracking-[0.14em] text-cream/55 transition-colors hover:text-cream"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-cream/10 bg-ink px-4 py-3 lg:hidden">
        <span className="font-serif text-lg text-cream">Studio</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-1.5 text-cream/70 hover:text-cream"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>
      </div>

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
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 flex-col bg-ink transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-cream/10 px-5 py-4">
            <span className="font-serif text-lg text-cream">Studio</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="p-1 text-cream/60 hover:text-cream"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          {body}
        </aside>
      </div>

      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ink lg:flex">
        <div className="border-b border-cream/10 px-6 py-5">
          <span className="font-serif text-xl text-cream">Studio</span>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-cream/35">
            YT Onyx
          </p>
        </div>
        {body}
      </aside>
    </>
  );
}

/** Static stand-in while the navigation hydrates. */
export function AdminNavFallback() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 bg-ink lg:block">
      <div className="border-b border-cream/10 px-6 py-5">
        <span className="font-serif text-xl text-cream">Studio</span>
      </div>
    </aside>
  );
}
