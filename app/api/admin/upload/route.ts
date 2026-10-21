import { NotAuthorizedError, requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import {
  ACCEPTED_MIME_TYPES,
  isAcceptedMimeType,
  MAX_UPLOAD_BYTES,
  processAndStoreImage,
} from "@/lib/images";
import { prisma } from "@/lib/prisma";
import {
  revalidateProductsFromRoute,
  revalidateSettingsFromRoute,
} from "@/lib/revalidate-route";
import { storage } from "@/lib/storage";

/**
 * Image upload for the admin.
 *
 * A route handler rather than a server action, because the browser needs real
 * upload progress and that means XMLHttpRequest. Every file is validated,
 * normalised by Sharp and written through the storage adapter.
 *
 * `target` decides where the result is attached:
 *   product  + id -> a new row in the product gallery
 *   category + id -> the category's single image
 *   hero / logo   -> the matching field in site settings
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    throw error;
  }

  const form = await request.formData();

  try {
    await assertCsrf(form);
  } catch {
    return Response.json({ ok: false, error: "csrf" }, { status: 403 });
  }

  const target = String(form.get("target") ?? "product");
  const files = form
    .getAll("files")
    .filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return Response.json({ ok: false, error: "no_files" }, { status: 400 });
  }

  const rejected: { name: string; reason: string }[] = [];

  /** Shared validation + Sharp processing for one file. */
  const accept = async (file: File, prefix: string) => {
    if (!isAcceptedMimeType(file.type)) {
      rejected.push({
        name: file.name,
        reason: `Only ${ACCEPTED_MIME_TYPES.join(", ")} are accepted`,
      });
      return null;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push({
        name: file.name,
        reason: `Larger than ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}MB`,
      });
      return null;
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      return await processAndStoreImage(buffer, prefix);
    } catch {
      rejected.push({ name: file.name, reason: "Could not be processed" });
      return null;
    }
  };

  // ---------------------------------------------------------- product gallery
  if (target === "product") {
    const productId = String(form.get("productId") ?? "");
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, name: true },
    });

    if (!product) {
      return Response.json(
        { ok: false, error: "unknown_product" },
        { status: 404 },
      );
    }

    const [existingCount, lastImage] = await Promise.all([
      prisma.productImage.count({ where: { productId: product.id } }),
      prisma.productImage.findFirst({
        where: { productId: product.id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      }),
    ]);

    let sortOrder = (lastImage?.sortOrder ?? -1) + 1;
    let uploaded = 0;

    for (const file of files) {
      const processed = await accept(file, "products");
      if (!processed) continue;

      await prisma.productImage.create({
        data: {
          productId: product.id,
          fileKey: processed.fileKey,
          thumbKey: processed.thumbKey,
          width: processed.width,
          height: processed.height,
          blurDataUrl: processed.blurDataUrl,
          alt: product.name,
          sortOrder: sortOrder++,
          // The first image ever uploaded becomes the primary one.
          isPrimary: existingCount === 0 && uploaded === 0,
        },
      });

      uploaded += 1;
    }

    if (uploaded > 0) revalidateProductsFromRoute([product.slug]);
    return Response.json({ ok: true, uploaded, rejected });
  }

  // ------------------------------------------------- single-image targets
  const processed = await accept(files[0]!, target === "product" ? "products" : target);
  if (!processed) {
    return Response.json({ ok: false, error: "rejected", rejected }, { status: 400 });
  }

  const replaceKeys = async (previous: string | null | undefined) => {
    if (previous) await storage.delete(previous).catch(() => undefined);
  };

  if (target === "category") {
    const categoryId = String(form.get("categoryId") ?? "");
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, imageKey: true, slug: true },
    });

    if (!category) {
      return Response.json(
        { ok: false, error: "unknown_category" },
        { status: 404 },
      );
    }

    await prisma.category.update({
      where: { id: category.id },
      data: { imageKey: processed.fileKey },
    });
    await replaceKeys(category.imageKey);

    revalidateProductsFromRoute([]);
    return Response.json({ ok: true, uploaded: 1, rejected });
  }

  if (target === "hero" || target === "logo") {
    const field = target === "hero" ? "heroImageKey" : "logoKey";
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 1 },
      select: { heroImageKey: true, logoKey: true },
    });

    await prisma.siteSettings.upsert({
      where: { id: 1 },
      update: { [field]: processed.fileKey },
      create: { id: 1, [field]: processed.fileKey },
    });

    await replaceKeys(
      target === "hero" ? settings?.heroImageKey : settings?.logoKey,
    );

    revalidateSettingsFromRoute();
    return Response.json({ ok: true, uploaded: 1, rejected });
  }

  return Response.json({ ok: false, error: "unknown_target" }, { status: 400 });
}
