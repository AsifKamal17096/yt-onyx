import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImageManager } from "@/components/admin/ImageManager";
import { AdminPage } from "@/components/admin/PageShell";
import { ProductForm } from "@/components/admin/ProductForm";
import {
  deleteImageAction,
  deleteProductAction,
  reorderImagesAction,
  setPrimaryImageAction,
} from "@/app/admin/_actions/products";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdminPage } from "@/lib/auth";
import { csrfToken } from "@/lib/csrf";
import { CSRF_FIELD } from "@/lib/csrf-field";
import { prisma } from "@/lib/prisma";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Edit product" };

/** Formats integer cents back into the plain decimal the form expects. */
function toAmount(cents: number | null | undefined): string {
  return cents === null || cents === undefined ? "" : (cents / 100).toFixed(2);
}

function toText(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

export default async function EditProductPage(
  props: PageProps<"/admin/products/[id]">,
) {
  await requireAdminPage();
  const { id } = await props.params;

  const [csrf, product, categories, stoneTypes, colors, finishes] =
    await Promise.all([
      csrfToken(),
      prisma.product.findUnique({
        where: { id },
        include: {
          images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
        },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.stoneType.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.color.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.finish.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true },
      }),
    ]);

  if (!product) notFound();

  return (
    <AdminPage
      title={product.name}
      description={`SKU ${product.sku} · ${product.published ? "Published" : "Draft"}${
        product.isDemo ? " · Demo product" : ""
      }`}
      actions={
        product.published ? (
          <a
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-xs border border-line-strong px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:border-ink"
          >
            View
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
          </a>
        ) : null
      }
    >
      <section className="mb-8 border border-line bg-white p-5 sm:p-6">
        <h2 className="font-serif text-xl">Photographs</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Drag to reorder. The first image is used on listing pages and in
          WhatsApp link previews.
        </p>
        <div className="mt-5">
          <ImageManager
            productId={product.id}
            csrf={csrf}
            onReorder={reorderImagesAction}
            onDelete={deleteImageAction}
            onSetPrimary={setPrimaryImageAction}
            images={product.images.map((image) => ({
              id: image.id,
              url: mediaUrl(image.fileKey)!,
              thumbUrl: mediaUrl(image.thumbKey)!,
              alt: image.alt,
              isPrimary: image.isPrimary,
            }))}
          />
        </div>
      </section>

      <ProductForm
        csrf={csrf}
        options={{ categories, stoneTypes, colors, finishes }}
        values={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          categoryId: product.categoryId,
          stoneTypeId: product.stoneTypeId ?? "",
          colorId: product.colorId ?? "",
          finishId: product.finishId ?? "",
          price: toAmount(product.priceCents),
          compareAt: toAmount(product.compareAtCents),
          length: toText(product.length),
          width: toText(product.width),
          height: toText(product.height),
          dimensionUnit: product.dimensionUnit,
          weight: toText(product.weight),
          weightUnit: product.weightUnit,
          shortDescription: product.shortDescription,
          description: product.description,
          careInstructions: product.careInstructions ?? "",
          availability: product.availability,
          featured: product.featured,
          published: product.published,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
        }}
      />

      <section className="mt-8 border border-red-200 bg-red-50/50 p-5">
        <h2 className="font-serif text-xl text-red-900">Delete this product</h2>
        <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-red-800/80">
          Removes the product, its photographs and its files from the server.
          Past inquiries are kept, with the product name preserved. This cannot
          be undone.
        </p>
        <form action={deleteProductAction} className="mt-5">
          <input type="hidden" name={CSRF_FIELD} value={csrf} />
          <input type="hidden" name="id" value={product.id} />
          <ConfirmButton
            title={`Delete ${product.name}?`}
            body="The product and its photographs will be permanently removed from the website and from the server."
            confirmLabel="Delete product"
          >
            Delete product
          </ConfirmButton>
        </form>
      </section>

      <p className="mt-6 text-xs text-muted">
        <Link
          href={`${ADMIN_BASE}/products`}
          className="underline underline-offset-4 transition-colors hover:text-ink"
        >
          Back to all products
        </Link>
      </p>
    </AdminPage>
  );
}
