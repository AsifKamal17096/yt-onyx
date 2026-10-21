"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { SORT_OPTIONS, type SortKey } from "@/lib/product-query";
import { Portal } from "@/components/ui/Portal";
import { buildShopHref, type UrlPatch } from "@/lib/shop-params";
import { cn } from "@/lib/cn";

export type FilterOptions = {
  categories: { name: string; slug: string }[];
  stoneTypes: { name: string; slug: string }[];
  colors: { name: string; slug: string; hex: string | null }[];
  finishes: { name: string; slug: string }[];
  minPriceCents: number;
  maxPriceCents: number;
};

type Props = {
  options: FilterOptions;
  /** Set on a category page, where the category filter is fixed. */
  lockedCategory?: string;
  total: number;
  /**
   * "toolbar" = search, sort, active chips and the mobile filter drawer.
   * "rail"    = the filter groups shown beside the grid on large screens.
   * Both variants share this component so they stay in sync.
   */
  variant?: "toolbar" | "rail";
};

/**
 * Search, sort and filter controls for the shop.
 *
 * All state lives in the URL, so this component only reads the current search
 * params and pushes new ones — nothing is duplicated in React state except the
 * two price inputs and the open/closed state of the mobile drawer.
 */
export function ShopControls({
  options,
  lockedCategory,
  total,
  variant = "toolbar",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const urlTerm = searchParams.get("q") ?? "";
  const urlMin = searchParams.get("min") ?? "";
  const urlMax = searchParams.get("max") ?? "";

  const [term, setTerm] = useState(urlTerm);
  const [minPrice, setMinPrice] = useState(urlMin);
  const [maxPrice, setMaxPrice] = useState(urlMax);

  // When the URL changes under us (back button, a chip removed, a link
  // followed), reset the inputs during render — the pattern React recommends
  // instead of synchronising state in an effect.
  const [syncedUrl, setSyncedUrl] = useState(`${urlTerm}|${urlMin}|${urlMax}`);
  const currentUrl = `${urlTerm}|${urlMin}|${urlMax}`;
  if (syncedUrl !== currentUrl) {
    setSyncedUrl(currentUrl);
    setTerm(urlTerm);
    setMinPrice(urlMin);
    setMaxPrice(urlMax);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  const navigate = (patch: UrlPatch) => {
    const href = buildShopHref(pathname, searchParams, patch);
    startTransition(() => router.push(href, { scroll: false }));
  };

  type ActiveFilter = { key: string; label: string };

  const activeFilters: ActiveFilter[] = ([
    !lockedCategory && searchParams.get("category")
      ? {
          key: "category" as const,
          label:
            options.categories.find(
              (option) => option.slug === searchParams.get("category"),
            )?.name ?? searchParams.get("category")!,
        }
      : null,
    searchParams.get("stone")
      ? {
          key: "stone" as const,
          label:
            options.stoneTypes.find(
              (option) => option.slug === searchParams.get("stone"),
            )?.name ?? searchParams.get("stone")!,
        }
      : null,
    searchParams.get("color")
      ? {
          key: "color" as const,
          label:
            options.colors.find(
              (option) => option.slug === searchParams.get("color"),
            )?.name ?? searchParams.get("color")!,
        }
      : null,
    searchParams.get("finish")
      ? {
          key: "finish" as const,
          label:
            options.finishes.find(
              (option) => option.slug === searchParams.get("finish"),
            )?.name ?? searchParams.get("finish")!,
        }
      : null,
    searchParams.get("q")
      ? { key: "q" as const, label: `“${searchParams.get("q")}”` }
      : null,
    searchParams.get("min") || searchParams.get("max")
      ? {
          key: "price" as const,
          label: `$${searchParams.get("min") ?? "0"} – $${
            searchParams.get("max") ?? "∞"
          }`,
        }
      : null,
  ] as (ActiveFilter | null)[]).filter(
    (entry): entry is ActiveFilter => entry !== null,
  );

  const clearAll = () => {
    const keep = lockedCategory
      ? `?category=${lockedCategory}`
      : "";
    startTransition(() =>
      router.push(lockedCategory ? `${pathname}${keep}` : pathname, {
        scroll: false,
      }),
    );
  };

  const filterGroups = (
    <div className="space-y-8">
      {!lockedCategory ? (
        <FilterGroup
          title="Category"
          options={options.categories}
          selected={searchParams.get("category")}
          onSelect={(value) => navigate({ category: value })}
        />
      ) : null}
      <FilterGroup
        title="Stone"
        options={options.stoneTypes}
        selected={searchParams.get("stone")}
        onSelect={(value) => navigate({ stone: value })}
      />
      <FilterGroup
        title="Colour"
        options={options.colors}
        selected={searchParams.get("color")}
        onSelect={(value) => navigate({ color: value })}
        swatches
      />
      <FilterGroup
        title="Finish"
        options={options.finishes}
        selected={searchParams.get("finish")}
        onSelect={(value) => navigate({ finish: value })}
      />

      <div>
        <h3 className="eyebrow text-muted">Price (USD)</h3>
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({
              min: minPrice.trim() || null,
              max: maxPrice.trim() || null,
            });
            setDrawerOpen(false);
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder={String(Math.floor(options.minPriceCents / 100))}
            aria-label="Minimum price in US dollars"
            className="w-full border border-line bg-cream px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder={String(Math.ceil(options.maxPriceCents / 100))}
            aria-label="Maximum price in US dollars"
            className="w-full border border-line bg-cream px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
          />
          <button
            type="submit"
            className="shrink-0 border border-ink bg-ink px-3 py-2 text-[0.66rem] uppercase tracking-[0.16em] text-cream transition-colors hover:bg-ink-soft"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  );

  if (variant === "rail") {
    return <div className="hidden lg:block">{filterGroups}</div>;
  }

  return (
    <>
      {/* Search + sort bar */}
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            navigate({ q: term.trim() || null });
          }}
          className="relative w-full sm:max-w-xs"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={1.5}
          />
          <input
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search the collection"
            aria-label="Search products"
            className="w-full border border-line bg-cream py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-gold"
          />
        </form>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 border border-line px-3 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink lg:hidden"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
            Filters
            {activeFilters.length > 0 ? (
              <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center bg-gold px-1 text-[0.6rem] text-ink">
                {activeFilters.length}
              </span>
            ) : null}
          </button>

          <label className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted">
            <span className="hidden sm:inline">Sort</span>
            <select
              value={(searchParams.get("sort") as SortKey) ?? "newest"}
              onChange={(event) => navigate({ sort: event.target.value })}
              className="border border-line bg-cream px-2.5 py-2 text-[0.72rem] uppercase tracking-[0.14em] text-ink outline-none transition-colors focus:border-gold"
            >
              {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() =>
                filter.key === "price"
                  ? navigate({ min: null, max: null })
                  : navigate({ [filter.key]: null } as UrlPatch)
              }
              className="group inline-flex items-center gap-1.5 border border-line bg-cream-dim/60 px-2.5 py-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
            >
              {filter.label}
              <X className="h-3 w-3 text-muted group-hover:text-ink" strokeWidth={2} />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-[0.66rem] uppercase tracking-[0.14em] text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted">
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.6} />
        ) : null}
        {total} {total === 1 ? "piece" : "pieces"}
      </p>

      {/* Mobile filter drawer */}
      <Portal>
        <div
          className={cn(
            "fixed inset-0 z-50 lg:hidden",
            drawerOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!drawerOpen}
        >
        <div
          className={cn(
            "absolute inset-0 bg-ink/50 transition-opacity duration-300",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setDrawerOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-cream transition-transform duration-300 ease-[var(--ease-brand)]",
            drawerOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <span className="eyebrow text-muted">Filters</span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close filters"
              className="p-1 text-ink transition-colors hover:text-gold-deep"
            >
              <X className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6">{filterGroups}</div>
          <div className="border-t border-line p-4">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="w-full bg-ink py-3 text-[0.7rem] uppercase tracking-[0.18em] text-cream"
            >
              Show {total} {total === 1 ? "piece" : "pieces"}
            </button>
          </div>
          </div>
        </div>
      </Portal>
    </>
  );
}

function FilterGroup({
  title,
  options,
  selected,
  onSelect,
  swatches = false,
}: {
  title: string;
  options: { name: string; slug: string; hex?: string | null }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  swatches?: boolean;
}) {
  if (options.length === 0) return null;

  return (
    <div>
      <h3 className="eyebrow text-muted">{title}</h3>
      <ul className="mt-4 space-y-2">
        {options.map((option) => {
          const active = selected === option.slug;
          return (
            <li key={option.slug}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(active ? null : option.slug)}
                className={cn(
                  "flex w-full items-center gap-2.5 text-left text-sm transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center border transition-colors",
                    active ? "border-ink bg-ink" : "border-line-strong",
                  )}
                  style={
                    swatches && option.hex && !active
                      ? { backgroundColor: option.hex }
                      : undefined
                  }
                >
                  {active ? (
                    <Check className="h-3 w-3 text-cream" strokeWidth={2.5} />
                  ) : null}
                </span>
                {option.name}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
