import crypto from "node:crypto";
import sharp from "sharp";
import { storage } from "@/lib/storage";

/**
 * Server-side image pipeline.
 *
 * Every uploaded photo is auto-rotated from its EXIF orientation, stripped of
 * metadata (sharp drops it unless asked to keep it), capped at 2000px on the
 * long edge and written out as WebP in two sizes plus a tiny inline blur
 * placeholder. Originals are intentionally not kept: they are typically 5-10MB
 * phone photos and nothing in the site serves them.
 */

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15MB
export const ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

const MAX_EDGE = 2000;
const THUMB_EDGE = 700;

export type ProcessedImage = {
  fileKey: string;
  thumbKey: string;
  width: number;
  height: number;
  blurDataUrl: string;
};

export function isAcceptedMimeType(type: string): boolean {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(type);
}

/**
 * Processes one uploaded image and writes both renditions to storage.
 *
 * @param data   raw bytes of the upload
 * @param prefix storage folder, e.g. "products" or "site"
 */
export async function processAndStoreImage(
  data: Buffer,
  prefix = "products",
): Promise<ProcessedImage> {
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString("hex")}`;
  const folder = `${prefix}/${new Date().getUTCFullYear()}`;
  const fileKey = `${folder}/${id}.webp`;
  const thumbKey = `${folder}/${id}-thumb.webp`;

  // rotate() with no argument applies the EXIF orientation, which also means
  // width/height below are the values the browser will actually render.
  const base = sharp(data, { failOn: "truncated" }).rotate();

  const fullBuffer = await base
    .clone()
    .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();

  const { width = 0, height = 0 } = await sharp(fullBuffer).metadata();

  const thumbBuffer = await base
    .clone()
    .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toBuffer();

  // 16px wide WebP, inlined as a data URL for next/image's blur placeholder.
  const blurBuffer = await base
    .clone()
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();

  await storage.save(fileKey, fullBuffer);
  await storage.save(thumbKey, thumbBuffer);

  return {
    fileKey,
    thumbKey,
    width,
    height,
    blurDataUrl: `data:image/webp;base64,${blurBuffer.toString("base64")}`,
  };
}

/** Removes both renditions of a stored image, ignoring missing files. */
export async function deleteStoredImage(keys: {
  fileKey: string;
  thumbKey: string;
}): Promise<void> {
  await Promise.all([
    storage.delete(keys.fileKey).catch(() => undefined),
    storage.delete(keys.thumbKey).catch(() => undefined),
  ]);
}
