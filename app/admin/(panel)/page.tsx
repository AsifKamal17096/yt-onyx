import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  Boxes,
  FileEdit,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { AdminLinkButton, AdminPage } from "@/components/admin/PageShell";
import { SetupPanel } from "@/components/admin/SetupPanel";
import { ADMIN_BASE, ADMIN_PATH_IS_CUSTOM } from "@/lib/admin-path";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { formatDate, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/time-window";

export const metadata: Metadata = { title: "Dashboard" };

// Generating the demo catalogue's imagery runs inside this route's request.
export const maxDuration = 60;

export default async function DashboardPage() {
  const session = await requireAdminPage();

  const since = daysAgo(30);

  const [
    productCount,
    publishedCount,
    demoCount,
    categories,
    recent,
    inquiryCount,
    topInquiries,
    settings,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { published: true } }),
    prisma.product.count({ where: { isDemo: true } }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        priceCents: true,
        published: true,
        createdAt: true,
      },
    }),
    prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.inquiry.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: since }, productId: { not: null } },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
    }),
    prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { whatsappNumber: true },
    }),
  ]);

  const csrf = await csrfToken();

  const topProducts = await prisma.product.findMany({
    where: { id: { in: topInquiries.map((row) => row.productId!) } },
    select: { id: true, name: true, slug: true },
  });

  const topWithCounts = topInquiries
    .map((row) => ({
      count: row._count.productId,
      product: topProducts.find((product) => product.id === row.productId),
    }))
    .filter(
      (entry): entry is { count: number; product: { id: string; name: string; slug: string } } =>
        Boolean(entry.product),
    );

  const whatsappMissing = !settings?.whatsappNumber?.trim();

  return (
    <AdminPage
      title="Dashboard"
      description={`Signed in as ${session.email}.`}
      actions={
        <AdminLinkButton href={`${ADMIN_BASE}/products/new`}>
          New product
        </AdminLinkButton>
      }
    >
      {productCount === 0 ? <SetupPanel csrf={csrf} /> : null}

      {whatsappMissing ? (
        <div className="mb-6 flex flex-col gap-3 border border-amber-300 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              strokeWidth={1.7}
            />
            <div>
              <h2 className="text-sm font-medium text-amber-900">
                WhatsApp number not set
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-amber-800">
                Every “Order on WhatsApp” button currently sends customers to
                the contact page instead of opening a chat.
              </p>
            </div>
          </div>
          <Link
            href={`${ADMIN_BASE}/settings`}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xs bg-amber-900 px-4 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-amber-950"
          >
            Add it now
          </Link>
        </div>
      ) : null}

      {!ADMIN_PATH_IS_CUSTOM ? (
        <div className="mb-6 border border-line bg-white p-5">
          <h2 className="text-sm font-medium text-ink">
            This panel is still at the default address
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            Before going live, set <code className="text-ink">ADMIN_PATH</code>{" "}
            in your .env to something unguessable. The panel moves to that path
            and /admin starts returning 404.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Products"
          value={productCount}
          hint={`${publishedCount} published · ${productCount - publishedCount} draft`}
          Icon={Boxes}
        />
        <StatCard
          label="Categories"
          value={categories.length}
          hint="Across the whole catalogue"
          Icon={FileEdit}
        />
        <StatCard
          label="Inquiries (30 days)"
          value={inquiryCount}
          hint="WhatsApp buttons pressed"
          Icon={MessageSquare}
        />
        <StatCard
          label="Demo products"
          value={demoCount}
          hint={demoCount > 0 ? "Safe to delete once you add your own" : "All clear"}
          Icon={Sparkles}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel
          title="Most asked about"
          hint="Last 30 days"
          empty="No WhatsApp clicks recorded yet."
          isEmpty={topWithCounts.length === 0}
        >
          <ul className="divide-y divide-line">
            {topWithCounts.map(({ product, count }) => (
              <li
                key={product.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <Link
                  href={`${ADMIN_BASE}/products/${product.id}`}
                  className="truncate text-sm text-ink transition-colors hover:text-gold-deep"
                >
                  {product.name}
                </Link>
                <span className="shrink-0 text-xs uppercase tracking-[0.14em] text-muted">
                  {count} {count === 1 ? "click" : "clicks"}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recently added"
          hint="Newest first"
          empty="Nothing here yet."
          isEmpty={recent.length === 0}
        >
          <ul className="divide-y divide-line">
            {recent.map((product) => (
              <li key={product.id} className="flex items-center gap-4 py-3">
                <Link
                  href={`${ADMIN_BASE}/products/${product.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-ink transition-colors hover:text-gold-deep"
                >
                  {product.name}
                </Link>
                <span className="shrink-0 text-xs text-muted">
                  {formatPrice(product.priceCents)}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em] ${
                    product.published
                      ? "bg-green-100 text-green-800"
                      : "bg-cream-dim text-muted"
                  }`}
                >
                  {product.published ? "Live" : "Draft"}
                </span>
                <span className="hidden shrink-0 text-xs text-muted sm:block">
                  {formatDate(product.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          title="Products per category"
          empty="No categories yet."
          isEmpty={categories.length === 0}
        >
          <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-4 border-b border-line py-2.5"
              >
                <Link
                  href={`${ADMIN_BASE}/products?category=${category.slug}`}
                  className="truncate text-sm text-ink transition-colors hover:text-gold-deep"
                >
                  {category.name}
                </Link>
                <span className="text-xs text-muted">
                  {category._count.products}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AdminPage>
  );
}

function StatCard({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: number;
  hint: string;
  Icon: typeof Boxes;
}) {
  return (
    <div className="border border-line bg-white p-5">
      <div className="flex items-start justify-between">
        <p className="text-[0.64rem] uppercase tracking-[0.16em] text-muted">
          {label}
        </p>
        <Icon className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
      </div>
      <p className="mt-3 font-serif text-4xl text-ink">{value}</p>
      <p className="mt-1.5 text-xs text-muted">{hint}</p>
    </div>
  );
}

function Panel({
  title,
  hint,
  children,
  empty,
  isEmpty,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  empty: string;
  isEmpty: boolean;
}) {
  return (
    <section className="border border-line bg-white p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-serif text-xl text-ink">{title}</h2>
        {hint ? (
          <span className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">
            {hint}
          </span>
        ) : null}
      </div>
      <div className="mt-4">
        {isEmpty ? (
          <p className="py-6 text-center text-sm text-muted">{empty}</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
