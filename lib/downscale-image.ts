"use client";

/**
 * Shrinks a photograph in the browser before it is uploaded.
 *
 * Serverless platforms cap request bodies — Vercel at 4.5MB — and a modern
 * phone photograph is routinely 8–12MB, so a straight upload would fail. The
 * file is drawn to a canvas at the same 2000px limit the server applies and
 * re-encoded as JPEG, which brings a 12MB photograph down to roughly 1MB.
 *
 * The server still runs the authoritative Sharp pipeline on what arrives, so
 * this only changes how many bytes travel, never the final rendition. Files
 * that are already small, or that the browser cannot decode, are passed
 * through untouched.
 */

const MAX_EDGE = 2000;
const TARGET_QUALITY = 0.9;
/** Below this, sending the original costs nothing and keeps full fidelity. */
const SKIP_BELOW_BYTES = 1_500_000;

export async function downscaleForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= SKIP_BELOW_BYTES) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    // createImageBitmap honours EXIF orientation, so the canvas matches what
    // the customer saw in their gallery.
    const bitmap = await createImageBitmap(file, {
      imageOrientation: "from-image",
    });

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", TARGET_QUALITY),
    );

    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    // A format the browser cannot decode: let the server deal with it.
    return file;
  }
}
