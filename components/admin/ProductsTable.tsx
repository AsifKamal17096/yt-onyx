"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { bulkProductAction } from "@/app/admin/_actions/products";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { useAdminPath } from "@/components/admin/AdminPathProvider";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  priceCents: number;
  published: boolean;
  featured: boolean;
  isDemo: boolean;
  categoryName: string;
  thumbUrl: string | null;
  updatedAt: string;
};

/**
 * Products table with multi-select and bulk actions.
 *
 * The whole table is one form: the checkboxes contribute `ids`, and each bulk
 * button submits a different `intent`. That keeps the server action simple and
 * the UI working even while JavaScript is still loading.
 */
export function ProductsTable({
  rows,
  csrf,
}: {
  rows: ProductRow[];
  csrf: string;
}) {
  const adminUrl = useAdminPath();
  const [selected, setSelected] = useState<string[]>([]);

  const allSelected = rows.length > 0 && selected.length === rows.length;

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );

  return (
    <form action={bulkProductAction}>
      <input type="hidden" name={CSRF_FIELD} value={csrf} />

      <div
        className={cn(
          "sticky top-0 z-10 flex flex-wrap items-center gap-2 border border-line bg-white px-4 py-3 transition-opacity",
          selected.length === 0 && "pointer-events-none opacity-45",
        )}
      >
        <span className="mr-2 text-xs uppercase tracking-[0.14em] text-muted">
          {selected.length} selected
        </span>
        <BulkButton intent="publish">Publish</BulkButton>
        <BulkButton intent="unpublish">Unpublish</BulkButton>
        <BulkButton intent="feature">Feature</BulkButton>
        <BulkButton intent="unfeature">Unfeature</BulkButton>
        <ConfirmButton
          name="intent"
          value="delete"
          title={`Delete ${selected.length} product${selected.length === 1 ? "" : "s"}?`}
          body="The products and all of their photographs will be permanently removed. This cannot be undone."
          confirmLabel="Delete them"
        >
          Delete
        </ConfirmButton>
      </div>

      <div className="mt-4 overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[0.62rem] uppercase tracking-[0.16em] text-muted">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? [] : rows.map((row) => row.id))
                  }
                  className="h-4 w-4 accent-[#0A0A0A]"
                />
              </th>
              <th className="px-3 py-3">Product</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Price</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-cream-dim/40">
                <td className="px-4 py-3 align-middle">
                  <input
                    type="checkbox"
                    name="ids"
                    value={row.id}
                    checked={selected.includes(row.id)}
                    onChange={() => toggle(row.id)}
                    aria-label={`Select ${row.name}`}
                    className="h-4 w-4 accent-[#0A0A0A]"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-cream-dim">
                      {row.thumbUrl ? (
                        <Image
                          src={row.thumbUrl}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={adminUrl(`/products/${row.id}`)}
                        className="block truncate font-medium text-ink transition-colors hover:text-gold-deep"
                      >
                        {row.name}
                      </Link>
                      <span className="text-xs text-muted">{row.sku}</span>
                      {row.isDemo ? (
                        <span className="ml-2 bg-cream-dim px-1.5 py-0.5 text-[0.58rem] uppercase tracking-[0.12em] text-muted">
                          Demo
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">{row.categoryName}</td>
                <td className="px-3 py-3">{formatPrice(row.priceCents)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.14em]",
                        row.published
                          ? "bg-green-100 text-green-800"
                          : "bg-cream-dim text-muted",
                      )}
                    >
                      {row.published ? "Live" : "Draft"}
                    </span>
                    {row.featured ? (
                      <Star
                        className="h-3.5 w-3.5 text-gold-deep"
                        strokeWidth={1.8}
                        aria-label="Featured"
                      />
                    ) : null}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs text-muted">{row.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}

function BulkButton({
  intent,
  children,
}: {
  intent: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      name="intent"
      value={intent}
      className="h-9 rounded-xs border border-line-strong px-3.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
    >
      {children}
    </button>
  );
}

export { formatDate };
