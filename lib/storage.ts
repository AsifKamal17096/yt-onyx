import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage adapter.
 *
 * Uploaded files are referenced everywhere by an opaque *key* such as
 * "products/2026/abc123.webp" — never by a filesystem path or a public URL.
 * That indirection is the whole point: swapping the local-disk implementation
 * below for Cloudinary or S3 means writing one more object with these five
 * methods and changing the `storage` export. Nothing else in the app changes.
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

export const storage: StorageAdapter = new LocalDiskStorage();

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
