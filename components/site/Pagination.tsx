import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildShopHref, type RawSearchParams } from "@/lib/shop-params";
import { cn } from "@/lib/cn";

/**
 * Server-rendered pagination: real links, so search engines can follow them
 * and the back button behaves.
 */
export function Pagination({
  page,
  pageCount,
  pathname,
  searchParams,
}: {
  page: number;
  pageCount: number;
  pathname: string;
  searchParams: RawSearchParams;
}) {
  if (pageCount <= 1) return null;

  const href = (target: number) =>
    buildShopHref(pathname, searchParams, { page: String(target) });

  // Show first, last, current and its neighbours; gaps become ellipses.
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (candidate) =>
      candidate === 1 ||
      candidate === pageCount ||
      Math.abs(candidate - page) <= 1,
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-16 flex items-center justify-center gap-1.5"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
          rel="prev"
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center border border-line text-ink transition-colors hover:border-ink"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      ) : null}

      {pages.map((candidate, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && candidate - previous > 1;

        return (
          <span key={candidate} className="flex items-center gap-1.5">
            {gap ? <span className="px-1 text-xs text-muted">…</span> : null}
            <Link
              href={href(candidate)}
              aria-current={candidate === page ? "page" : undefined}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center border px-2 text-xs transition-colors",
                candidate === page
                  ? "border-ink bg-ink text-cream"
                  : "border-line text-muted hover:border-ink hover:text-ink",
              )}
            >
              {candidate}
            </Link>
          </span>
        );
      })}

      {page < pageCount ? (
        <Link
          href={href(page + 1)}
          rel="next"
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center border border-line text-ink transition-colors hover:border-ink"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
        </Link>
      ) : null}
    </nav>
  );
}
