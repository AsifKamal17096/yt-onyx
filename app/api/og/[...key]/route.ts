import sharp from "sharp";
import { isValidStorageKey, storage } from "@/lib/storage";
import { BRAND } from "@/lib/brand";

/**
 * JPEG renditions of product photographs, for link previews.
 *
 * Stored images are WebP, which some link-preview crawlers — WhatsApp's among
 * them — handle unreliably. Since sharing a product on WhatsApp is the whole
 * point of this site, Open Graph tags point here instead: the same photograph,
 * letterboxed onto brand black at 1200x630 and encoded as JPEG.
 *
 * The request path mirrors the storage key with a .jpg extension, so
 * "products/2026/abc.jpg" is served from "products/2026/abc.webp".
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/og/[...key]">,
) {
  const { key: segments } = await context.params;
  const requested = segments.join("/");

  if (!requested.endsWith(".jpg")) {
    return new Response("Not found", { status: 404 });
  }

  const sourceKey = `${requested.slice(0, -".jpg".length)}.webp`;
  if (!isValidStorageKey(sourceKey)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const source = await storage.read(sourceKey);

    const jpeg = await sharp(source)
      .resize(1200, 630, {
        fit: "contain",
        background: BRAND.colors.ink,
      })
      .jpeg({ quality: 82, progressive: true })
      .toBuffer();

    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(jpeg.length),
        // Keys are unique per upload, so the bytes never change.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
