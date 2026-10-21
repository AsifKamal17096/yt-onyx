import Link from "next/link";
import type { Metadata } from "next";
import { AdminPage, EmptyState } from "@/components/admin/PageShell";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdminPage } from "@/lib/auth";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/time-window";

export const metadata: Metadata = { title: "Inquiries" };

const PER_PAGE = 60;

const SOURCE_LABELS: Record<string, string> = {
  PRODUCT: "Product page",
  INQUIRY_LIST: "Inquiry list",
  FLOATING: "Floating button",
  CONTACT: "Contact page",
};

export default async function InquiriesPage(
  props: PageProps<"/admin/inquiries">,
) {
  await requireAdminPage();

  const params = await props.searchParams;
  const read = (key: string) => {
    const value = params[key];
    const first = Array.isArray(value) ? value[0] : value;
    return first?.trim() || "";
  };

  const source = read("source");
  const days = Number(read("days")) || 30;
  const page = Math.max(1, Number(read("page")) || 1);

  const where: Prisma.InquiryWhereInput = {
    createdAt: { gte: daysAgo(days) },
  };
  if (source && source in SOURCE_LABELS) {
    where.source = source as Prisma.InquiryWhereInput["source"];
  }

  const [total, rows, byCountry] = await Promise.all([
    prisma.inquiry.count({ where }),
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        productId: true,
        productName: true,
        quantity: true,
        source: true,
        country: true,
        createdAt: true,
        product: { select: { name: true } },
      },
    }),
    prisma.inquiry.groupBy({
      by: ["country"],
      where: { ...where, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: "desc" } },
      take: 8,
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const pageHref = (targetPage: number) => {
    const search = new URLSearchParams();
    if (source) search.set("source", source);
    if (days !== 30) search.set("days", String(days));
    if (targetPage > 1) search.set("page", String(targetPage));
    const query = search.toString();
    return query
      ? `${ADMIN_BASE}/inquiries?${query}`
      : `${ADMIN_BASE}/inquiries`;
  };

  return (
    <AdminPage
      title="Inquiries"
      description={`${total} WhatsApp click${
        total === 1 ? "" : "s"
      } in the last ${days} days. This is a log of interest, not of completed orders.`}
    >
      <form
        method="get"
        className="flex flex-wrap items-end gap-3 border border-line bg-white p-4"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            Source
          </span>
          <select
            name="source"
            defaultValue={source}
            className="border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="">All</option>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.62rem] uppercase tracking-[0.14em] text-muted">
            Period
          </span>
          <select
            name="days"
            defaultValue={String(days)}
            className="border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-gold"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </label>

        <button
          type="submit"
          className="h-11 rounded-xs bg-ink px-5 text-[0.7rem] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-ink-soft"
        >
          Apply
        </button>
      </form>

      {byCountry.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {byCountry.map((row) => (
            <span
              key={row.country}
              className="border border-line bg-white px-3 py-1.5 text-xs text-muted"
            >
              {row.country} · {row._count.country}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        {rows.length === 0 ? (
          <EmptyState
            title="No inquiries yet"
            body="Every time someone presses a WhatsApp button, it is recorded here with the product and quantity."
          />
        ) : (
          <>
            <div className="overflow-x-auto border border-line bg-white">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[0.62rem] uppercase tracking-[0.16em] text-muted">
                    <th className="px-4 py-3">When</th>
                    <th className="px-3 py-3">Product</th>
                    <th className="px-3 py-3">Qty</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Country</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-cream-dim/40">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                        {row.createdAt.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-3 py-3">
                        {row.productId ? (
                          <Link
                            href={`${ADMIN_BASE}/products/${row.productId}`}
                            className="text-ink transition-colors hover:text-gold-deep"
                          >
                            {row.product?.name ?? row.productName}
                          </Link>
                        ) : (
                          <span className="text-muted">
                            {row.productName ?? "General enquiry"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">{row.quantity}</td>
                      <td className="px-3 py-3 text-muted">
                        {SOURCE_LABELS[row.source] ?? row.source}
                      </td>
                      <td className="px-3 py-3 text-muted">
                        {row.country ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pageCount > 1 ? (
              <nav className="mt-5 flex items-center justify-center gap-2 text-xs">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(
                  (candidate) => (
                    <Link
                      key={candidate}
                      href={pageHref(candidate)}
                      aria-current={candidate === page ? "page" : undefined}
                      className={`flex h-8 min-w-8 items-center justify-center border px-2 ${
                        candidate === page
                          ? "border-ink bg-ink text-cream"
                          : "border-line text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      {candidate}
                    </Link>
                  ),
                )}
              </nav>
            ) : null}
          </>
        )}
      </div>
    </AdminPage>
  );
}
