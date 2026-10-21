import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { visitorFromHeaders } from "@/lib/request-info";

/**
 * Records WhatsApp clicks so the dashboard can show which pieces people
 * actually ask about.
 *
 * It is fire-and-forget from the browser: the response is never awaited before
 * WhatsApp opens, and a failure here must never interrupt an order.
 */

const BodySchema = z.object({
  source: z.enum(["PRODUCT", "INQUIRY_LIST", "FLOATING", "CONTACT"]),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .max(40)
    .default([]),
});

// 20 logged clicks per 10 minutes per visitor is far above honest use.
const LIMIT = 20;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const { ipHash, country } = visitorFromHeaders(request.headers);

  const limit = rateLimit(`inquiry:${ipHash}`, LIMIT, WINDOW_MS);
  if (!limit.ok) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const { source, items } = parsed.data;

  // A click with no product (floating button, header, contact page) is still
  // worth counting, but carries no product reference.
  if (items.length === 0) {
    await prisma.inquiry.create({
      data: { source, quantity: 1, country, ipHash },
    });
    return Response.json({ ok: true });
  }

  // Only log products that really exist and are published — this endpoint is
  // public, so ids from the request are never trusted.
  const products = await prisma.product.findMany({
    where: {
      id: { in: items.map((item) => item.productId) },
      published: true,
    },
    select: { id: true, name: true },
  });

  const byId = new Map(products.map((product) => [product.id, product.name]));
  const rows = items
    .filter((item) => byId.has(item.productId))
    .map((item) => ({
      productId: item.productId,
      productName: byId.get(item.productId) ?? null,
      quantity: item.quantity,
      source,
      country,
      ipHash,
    }));

  if (rows.length > 0) {
    await prisma.inquiry.createMany({ data: rows });
  }

  return Response.json({ ok: true, logged: rows.length });
}
