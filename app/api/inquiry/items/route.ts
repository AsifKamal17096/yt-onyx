import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { visitorFromHeaders } from "@/lib/request-info";
import { storage } from "@/lib/storage";

/**
 * Current details for the pieces on a visitor's inquiry list.
 *
 * The list itself lives in localStorage, so it holds a snapshot taken when an
 * item was added. The drawer calls this on open to refresh names, prices and
 * images, and to drop anything that has since been unpublished or deleted —
 * nobody should message us quoting last month's price.
 */

const MAX_IDS = 40;

export async function GET(request: Request) {
  const { ipHash } = visitorFromHeaders(request.headers);

  const limit = rateLimit(`inquiry-items:${ipHash}`, 60, 10 * 60 * 1000);
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  const url = new URL(request.url);
  const ids = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && id.length <= 64)
    .slice(0, MAX_IDS);

  if (ids.length === 0) {
    return Response.json({ ok: true, items: [] });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids }, published: true },
    select: {
      id: true,
      slug: true,
      name: true,
      sku: true,
      priceCents: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { thumbKey: true },
      },
    },
  });

  return Response.json({
    ok: true,
    items: products.map((product) => ({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      priceCents: product.priceCents,
      thumbUrl: product.images[0]
        ? storage.url(product.images[0].thumbKey)
        : null,
    })),
  });
}
