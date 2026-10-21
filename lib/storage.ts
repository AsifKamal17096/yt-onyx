import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, head, put } from "@vercel/blob";

/**
 * Storage adapter.
 *
 * Uploaded files are referenced everywhere by an opaque *key* such as
 * "products/2026/abc123.webp" — never by a filesystem path or a public URL.
 * That indirection is the whole point: two implementations live below and the
 * rest of the application cannot tell them apart.
 *
 *  - **Vercel Blob** is used whenever BLOB_READ_WRITE_TOKEN is present, which
 *    is the case on Vercel. Serverless filesystems are read-only and
 *    disposable, so uploads have to live outside the deployment.
 *  - **Local disk** is used otherwise, for development and for a VPS.
 */
export interface StorageAdapter {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  /** Node stream + size, used by the media route to avoid buffering. */
  stream(key: string): Promise<{ stream: NodeJS.ReadableStream; size: number }>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  /** Public URL the browser can request for this key. */
  url(key: string): string;
}

/** Keys are lowercase, slash-separated and always carry an extension. */
const KEY_PATTERN = /^[a-z0-9][a-z0-9/._-]*\.[a-z0-9]+$/;

export function isValidStorageKey(key: string): boolean {
  if (!KEY_PATTERN.test(key)) return false;
  // Defence in depth against traversal: no "..", no leading/double slashes.
  if (key.includes("..") || key.includes("//")) return false;
  return true;
}

/** Absolute path of the uploads root, resolved from UPLOADS_DIR. */
export function uploadsRoot(): string {
  const configured = process.env.UPLOADS_DIR?.trim() || "uploads";
  // turbopackIgnore keeps the bundler from tracing the whole project just
  // because this path is computed at runtime.
  return path.isAbsolute(configured)
    ? configured
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), configured);
}

class LocalDiskStorage implements StorageAdapter {
  private resolve(key: string): string {
    if (!isValidStorageKey(key)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    const root = uploadsRoot();
    const target = path.resolve(root, key);
    // Final guard: the resolved path must stay inside the uploads root.
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error(`Storage key escapes the uploads directory: ${key}`);
    }
    return target;
  }

  async save(key: string, data: Buffer): Promise<void> {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, data);
  }

  async read(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async stream(key: string) {
    const target = this.resolve(key);
    const info = await stat(target);
    return { stream: createReadStream(target), size: info.size };
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await stat(this.resolve(key));
      return true;
    } catch {
      return false;
    }
  }

  url(key: string): string {
    return `/api/media/${key}`;
  }
}

/**
 * Vercel Blob.
 *
 * A blob URL normally gets a random suffix chosen at upload time, which would
 * make it impossible to derive from the key. `addRandomSuffix: false` keeps
 * the two in step, so key and URL stay interchangeable.
 *
 * Authentication has two shapes. A connected project on Vercel authenticates
 * through OIDC and gets no token at all — only BLOB_STORE_ID — while anywhere
 * else (a VPS, a script on a laptop) needs an explicit BLOB_READ_WRITE_TOKEN.
 * Both are supported, and the public address is derived from whichever of the
 * two is present.
 */
class VercelBlobStorage implements StorageAdapter {
  /** Learned from the first successful upload, in case the guess is wrong. */
  private static observedBase: string | null = null;

  private base(): string {
    const configured = process.env.BLOB_PUBLIC_BASE_URL?.trim();
    if (configured) return configured.replace(/\/+$/, "");

    if (VercelBlobStorage.observedBase) return VercelBlobStorage.observedBase;

    // "store_MhNcz1vDhbGyp0Vq" -> "mhncz1vdhbgyp0vq.public.blob…"
    const storeId = process.env.BLOB_STORE_ID?.trim().replace(/^store_/, "");
    // "vercel_blob_rw_<storeId>_<secret>"
    const fromToken = process.env.BLOB_READ_WRITE_TOKEN?.trim().split("_")[3];
    const id = storeId || fromToken;

    if (!id) {
      throw new Error(
        "No blob store is configured. Expected BLOB_STORE_ID (set automatically when a Vercel Blob store is connected) or BLOB_READ_WRITE_TOKEN.",
      );
    }

    return `https://${id.toLowerCase()}.public.blob.vercel-storage.com`;
  }

  /** Keeps the derived address honest by comparing it with a real upload. */
  private learnBase(uploadedUrl: string) {
    try {
      const origin = new URL(uploadedUrl).origin;
      if (origin !== this.base()) VercelBlobStorage.observedBase = origin;
    } catch {
      // A malformed URL is not worth failing an upload over.
    }
  }

  private assertKey(key: string) {
    if (!isValidStorageKey(key)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
  }

  async save(key: string, data: Buffer): Promise<void> {
    this.assertKey(key);
    const result = await put(key, data, {
      access: "public",
      addRandomSuffix: false,
      // Keys are unique per upload, so the bytes behind one never change.
      cacheControlMaxAge: 31536000,
      allowOverwrite: true,
    });
    this.learnBase(result.url);
  }

  async read(key: string): Promise<Buffer> {
    const response = await fetch(this.url(key));
    if (!response.ok) throw new Error(`Blob not found: ${key}`);
    return Buffer.from(await response.arrayBuffer());
  }

  async stream(key: string) {
    const buffer = await this.read(key);
    const { Readable } = await import("node:stream");
    return { stream: Readable.from(buffer), size: buffer.length };
  }

  async delete(key: string): Promise<void> {
    this.assertKey(key);
    await del(this.url(key));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await head(this.url(key));
      return true;
    } catch {
      return false;
    }
  }

  url(key: string): string {
    this.assertKey(key);
    return `${this.base()}/${key}`;
  }
}

/**
 * True when the app is running against Vercel Blob rather than local disk.
 *
 * A connected project on Vercel authenticates through OIDC and receives only
 * BLOB_STORE_ID — checking for a read-write token would miss it entirely and
 * silently fall back to a filesystem that cannot be written to.
 */
export const usingBlobStorage = Boolean(
  process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN,
);

export const storage: StorageAdapter = usingBlobStorage
  ? new VercelBlobStorage()
  : new LocalDiskStorage();

/** Convenience for components: turns a nullable key into a usable src. */
export function mediaUrl(key: string | null | undefined): string | null {
  return key ? storage.url(key) : null;
}

/**
 * URL of the JPEG link-preview rendition for a stored image.
 * See app/api/og/[...key]/route.ts for why previews are not served as WebP.
 */
export function ogImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const withoutExtension = key.replace(/\.[a-z0-9]+$/i, "");
  return `/api/og/${withoutExtension}.jpg`;
}
