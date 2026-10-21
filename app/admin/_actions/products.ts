"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { deleteStoredImage } from "@/lib/images";
import { prisma } from "@/lib/prisma";
import { revalidateProducts } from "@/lib/revalidate";
import { slugify, uniqueSlug } from "@/lib/slug";
import { fieldErrors, type ActionState } from "@/lib/action-state";

/**
 * Product mutations.
 *
 * Every action re-checks the session and the CSRF token: a server action is
 * reachable on its own URL, so it can never rely on the page around it having
 * been guarded.
 */

/** "1,250.00" or "1250" -> 125000 cents. */
const money = (label: string) =>
  z
    .string()
    .trim()
    .transform((value) => value.replace(/[^0-9.]/g, ""))
    .refine((value) => value.length > 0 && Number.isFinite(Number(value)), {
      message: `Enter ${label} as a number, e.g. 1250.00`,
    })
    .transform((value) => Math.round(Number(value) * 100));

const optionalMoney = z
  .string()
  .trim()
  .transform((value) => value.replace(/[^0-9.]/g, ""))
  .transform((value) =>
    value.length === 0 ? null : Math.round(Number(value) * 100),
  )
  .refine((value) => value === null || Number.isFinite(value), {
    message: "Enter a number, e.g. 1500.00",
  });

const optionalNumber = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : Number(value)))
  .refine((value) => value === null || Number.isFinite(value), {
    message: "Enter a number",
  });

const optionalId = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const ProductSchema = z.object({
  name: z.string().trim().min(2, "Give the piece a name").max(160),
  slug: z.string().trim().max(90).optional(),
  sku: z.string().trim().min(1, "Every product needs a SKU").max(60),
  categoryId: z.string().trim().min(1, "Choose a category"),
  stoneTypeId: optionalId,
  colorId: optionalId,
  finishId: optionalId,
  priceCents: money("the price"),
  compareAtCents: optionalMoney,
  length: optionalNumber,
  width: optionalNumber,
  height: optionalNumber,
  dimensionUnit: z.string().trim().max(10).default("cm"),
  weight: optionalNumber,
  weightUnit: z.string().trim().max(10).default("kg"),
  shortDescription: z
    .string()
    .trim()
    .min(10, "Write a short description (one or two lines)")
    .max(400),
  description: z.string().trim().min(20, "Write the full description").max(8000),
  careInstructions: z.string().trim().max(2000).optional(),
  availability: z.enum(["IN_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"]),
  featured: z.boolean(),
  published: z.boolean(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(400).optional(),
});

function readForm(formData: FormData) {
  const value = (key: string) => String(formData.get(key) ?? "");
  return {
    name: value("name"),
    slug: value("slug"),
    sku: value("sku"),
    categoryId: value("categoryId"),
    stoneTypeId: value("stoneTypeId"),
    colorId: value("colorId"),
    finishId: value("finishId"),
    priceCents: value("price"),
    compareAtCents: value("compareAt"),
    length: value("length"),
    width: value("width"),
    height: value("height"),
    dimensionUnit: value("dimensionUnit") || "cm",
    weight: value("weight"),
    weightUnit: value("weightUnit") || "kg",
    shortDescription: value("shortDescription"),
    description: value("description"),
    careInstructions: value("careInstructions"),
    availability: value("availability") || "IN_STOCK",
    featured: formData.get("featured") === "on",
    published: formData.get("published") === "on",
    seoTitle: value("seoTitle"),
    seoDescription: value("seoDescription"),
  };
}

export async function saveProductAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  try {
    await assertCsrf(formData);
  } catch {
    return { ok: false, message: "Reload the page and try again." };
  }

  const id = String(formData.get("id") ?? "").trim() || null;
  const parsed = ProductSchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Some fields need attention.",
      errors: fieldErrors(parsed.error.issues),
    };
  }

  const data = parsed.data;

  // SKUs identify a piece in WhatsApp messages, so they have to stay unique.
  const skuOwner = await prisma.product.findUnique({
    where: { sku: data.sku },
    select: { id: true },
  });
  if (skuOwner && skuOwner.id !== id) {
    return { ok: false, errors: { sku: "Another product already uses this SKU" } };
  }

  const desiredSlug = slugify(data.slug || data.name);
  const slug = await uniqueSlug(desiredSlug, async (candidate) => {
    const row = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(row) && row!.id !== id;
  });

  const existing = id
    ? await prisma.product.findUnique({
        where: { id },
        select: { slug: true, publishedAt: true },
      })
    : null;

  const values = {
    name: data.name,
    slug,
    sku: data.sku,
    categoryId: data.categoryId,
    stoneTypeId: data.stoneTypeId,
    colorId: data.colorId,
    finishId: data.finishId,
    priceCents: data.priceCents,
    compareAtCents: data.compareAtCents,
    length: data.length,
    width: data.width,
    height: data.height,
    dimensionUnit: data.dimensionUnit,
    weight: data.weight,
    weightUnit: data.weightUnit,
    shortDescription: data.shortDescription,
    description: data.description,
    careInstructions: data.careInstructions || null,
    availability: data.availability,
    featured: data.featured,
    published: data.published,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };

  if (id) {
    await prisma.product.update({
      where: { id },
      data: {
        ...values,
        // The publication date is stamped once and kept; unpublishing clears it.
        publishedAt: data.published
          ? (existing?.publishedAt ?? new Date())
          : null,
      },
    });

    // Revalidate the old slug too, in case it changed.
    revalidateProducts(
      [slug, existing?.slug].filter((value): value is string => Boolean(value)),
    );
    return { ok: true, message: "Product saved." };
  }

  const created = await prisma.product.create({
    data: {
      ...values,
      publishedAt: data.published ? new Date() : null,
      isDemo: false,
    },
    select: { id: true },
  });

  revalidateProducts([slug]);
  redirect(`${ADMIN_BASE}/products/${created.id}?created=1`);
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { slug: true, images: { select: { fileKey: true, thumbKey: true } } },
  });
  if (!product) return;

  // Remove the files first; the rows cascade with the product.
  for (const image of product.images) await deleteStoredImage(image);

  await prisma.product.delete({ where: { id } });
  revalidateProducts([product.slug]);

  redirect(`${ADMIN_BASE}/products?deleted=1`);
}

const BulkSchema = z.object({
  intent: z.enum(["publish", "unpublish", "delete", "feature", "unfeature"]),
  ids: z.array(z.string().min(1)).min(1),
});

export async function bulkProductAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const parsed = BulkSchema.safeParse({
    intent: formData.get("intent"),
    ids: formData.getAll("ids").map(String),
  });

  if (!parsed.success) return;
  const { intent, ids } = parsed.data;

  const affected = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      slug: true,
      images: { select: { fileKey: true, thumbKey: true } },
    },
  });

  if (intent === "delete") {
    for (const product of affected) {
      for (const image of product.images) await deleteStoredImage(image);
    }
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
  } else if (intent === "publish" || intent === "unpublish") {
    const published = intent === "publish";
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { published, ...(published ? {} : { publishedAt: null }) },
    });
    if (published) {
      // Stamp a publication date on anything that never had one.
      await prisma.product.updateMany({
        where: { id: { in: ids }, publishedAt: null },
        data: { publishedAt: new Date() },
      });
    }
  } else {
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { featured: intent === "feature" },
    });
  }

  revalidateProducts(affected.map((product) => product.slug));
}

/* ------------------------------------------------------------------ images */

export async function deleteImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const imageId = String(formData.get("imageId") ?? "");
  if (!imageId) return;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: {
      fileKey: true,
      thumbKey: true,
      isPrimary: true,
      productId: true,
      product: { select: { slug: true } },
    },
  });
  if (!image) return;

  await prisma.productImage.delete({ where: { id: imageId } });
  await deleteStoredImage(image);

  // Never leave a product without a primary image.
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (next) {
      await prisma.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  revalidateProducts([image.product.slug]);
}

export async function setPrimaryImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const imageId = String(formData.get("imageId") ?? "");
  if (!imageId) return;

  const image = await prisma.productImage.findUnique({
    where: { id: imageId },
    select: { productId: true, product: { select: { slug: true } } },
  });
  if (!image) return;

  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: image.productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({
      where: { id: imageId },
      data: { isPrimary: true, sortOrder: -1 },
    }),
  ]);

  revalidateProducts([image.product.slug]);
}

export async function reorderImagesAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const productId = String(formData.get("productId") ?? "");
  const order = String(formData.get("order") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!productId || order.length === 0) return;

  const owned = await prisma.productImage.findMany({
    where: { productId, id: { in: order } },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((image) => image.id));

  await prisma.$transaction(
    order
      .filter((id) => ownedIds.has(id))
      .map((id, index) =>
        prisma.productImage.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
  );

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true },
  });
  if (product) revalidateProducts([product.slug]);
}

export async function updateImageAltAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const imageId = String(formData.get("imageId") ?? "");
  const alt = String(formData.get("alt") ?? "").trim().slice(0, 200);
  if (!imageId) return;

  const image = await prisma.productImage.update({
    where: { id: imageId },
    data: { alt },
    select: { product: { select: { slug: true } } },
  });

  revalidateProducts([image.product.slug]);
}
