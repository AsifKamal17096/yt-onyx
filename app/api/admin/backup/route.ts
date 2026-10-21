import { stat } from "node:fs/promises";
import { PassThrough, Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { ZipArchive } from "archiver";
import { NotAuthorizedError, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage, uploadsRoot, usingBlobStorage } from "@/lib/storage";

/**
 * Downloads everything that cannot be rebuilt from the code.
 *
 * What goes into the zip depends on where the site runs:
 *
 *  - **Local disk** (development, VPS): a JSON export of every table plus the
 *    whole uploads folder, so the zip alone can restore the site.
 *  - **Vercel Blob**: the same JSON export plus a manifest of image URLs. The
 *    images are not copied — they live in Blob, which is already replicated,
 *    and pulling gigabytes through a serverless function to re-zip them would
 *    time out. The manifest makes fetching them one command.
 */
export const maxDuration = 60;

export async function GET() {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof NotAuthorizedError) {
      return new Response("Not found", { status: 404 });
    }
    throw error;
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const passthrough = new PassThrough();
  archive.pipe(passthrough);

  // --- content ------------------------------------------------------------
  const [
    categories,
    stoneTypes,
    colors,
    finishes,
    products,
    images,
    testimonials,
    inquiries,
    settings,
  ] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.stoneType.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.color.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.finish.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productImage.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  // The password hash never belongs in a file that gets emailed around.
  const safeSettings = settings
    ? {
        ...settings,
        adminPasswordHash: settings.adminPasswordHash ? "[redacted]" : null,
      }
    : null;

  archive.append(
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        categories,
        stoneTypes,
        colors,
        finishes,
        products,
        productImages: images,
        testimonials,
        inquiries,
        siteSettings: safeSettings,
      },
      null,
      2,
    ),
    { name: "content.json" },
  );

  // --- images -------------------------------------------------------------
  if (usingBlobStorage) {
    const urls = images.flatMap((image) => [
      storage.url(image.fileKey),
      storage.url(image.thumbKey),
    ]);

    archive.append(
      [
        "Every product image, as a direct URL.",
        "",
        "These files live in Vercel Blob, outside the deployment. To pull a",
        "local copy of all of them:",
        "",
        "  wget -i image-urls.txt -P images/",
        "",
        ...urls,
        "",
      ].join("\n"),
      { name: "image-urls.txt" },
    );
  } else {
    const uploads = uploadsRoot();
    try {
      await stat(uploads);
      archive.directory(uploads, "uploads");
    } catch {
      archive.append("No uploads yet.\n", { name: "uploads/README.txt" });
    }
  }

  archive.append(
    [
      `YT Onyx backup — ${new Date().toISOString()}`,
      "",
      "content.json     every row of every table, as JSON",
      usingBlobStorage
        ? "image-urls.txt   direct links to each stored image"
        : "uploads/         every processed product and site image",
      "",
      "The admin password hash is redacted on purpose; it lives in your",
      "environment variables, not in here.",
      "",
      "To restore: recreate the schema with `prisma migrate deploy`, then",
      "import content.json. Keep this file somewhere other than the server.",
      "",
    ].join("\n"),
    { name: "README.txt" },
  );

  void archive.finalize();

  const body = Readable.toWeb(
    passthrough,
  ) as NodeWebReadableStream<Uint8Array>;

  return new Response(body as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="yt-onyx-backup-${stamp}.zip"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
