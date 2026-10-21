import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { isValidStorageKey, storage } from "@/lib/storage";

/**
 * Serves uploaded images from the storage adapter.
 *
 * Uploads deliberately live outside /public: files added after the build would
 * not be part of it, and a route handler lets us validate the key and set a
 * long immutable cache. Every stored key is unique per upload, so the bytes
 * behind a URL never change and can be cached for a year.
 */

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  svg: "image/svg+xml",
};

export async function GET(
  _request: Request,
  context: RouteContext<"/api/media/[...key]">,
) {
  const { key: segments } = await context.params;
  const key = segments.join("/");

  if (!isValidStorageKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const { stream, size } = await storage.stream(key);
    const body = Readable.toWeb(
      stream as Readable,
    ) as NodeWebReadableStream<Uint8Array>;

    return new Response(body as unknown as BodyInit, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
