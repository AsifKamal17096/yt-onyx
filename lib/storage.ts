import { createReadStream } from "node:fs";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, head, put } from "@vercel/blob";

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
 * Two things vary between stores and are both discovered at runtime rather
 * than configured by hand:
 *
 *  - **Authentication.** A store connected to a Vercel project authenticates
 *    through OIDC and gets only BLOB_STORE_ID; anywhere else (a VPS, a script
 *    on a laptop) needs an explicit BLOB_READ_WRITE_TOKEN.
 *  - **Access.** A store is created either public or private, and an upload
 *    must match. The first upload tries both and remembers which one the
 *    store accepts.
 *
 * Images are always served through /api/media rather than a blob URL: private
 * blobs have no public URL at all, and routing both store types the same way
 * keeps one URL shape, one cache policy and one thing to reason about.
 */
class VercelBlobStorage implements StorageAdapter {
  /** Learned from the first successful call; "private" is tried first. */
  private static access: "public" | "private" | null =
    process.env.BLOB_ACCESS === "public"
      ? "public"
      : process.env.BLOB_ACCESS === "private"
        ? "private"
        : null;

  private assertKey(key: string) {
    if (!isValidStorageKey(key)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
  }

  /**
   * Runs an operation against whichever access level the store uses, learning
   * the answer from the first success. Only the access-mismatch error is
   * retried; everything else is a real failure and is rethrown at once.
   */
  private async withAccess<T>(
    operation: (access: "public" | "private") => Promise<T>,
  ): Promise<T> {
    const known = VercelBlobStorage.access;
    const order: ("public" | "private")[] = known
      ? [known]
      : ["private", "public"];

    let lastError: unknown;

    for (const access of order) {
      try {
        const result = await operation(access);
        VercelBlobStorage.access = access;
        return result;
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);
        if (!/access|private store|public store/i.test(message)) throw error;
      }
    }

    throw lastError;
  }

  async save(key: string, data: Buffer): Promise<void> {
    this.assertKey(key);
    await this.withAccess((access) =>
      put(key, data, {
        access,
        // Without this the URL gets a random suffix and stops matching the key.
        addRandomSuffix: false,
        // Keys are unique per upload, so the bytes behind one never change.
        cacheControlMaxAge: 31536000,
        allowOverwrite: true,
      }),
    );
  }

  async read(key: string): Promise<Buffer> {
    const { stream } = await this.openStream(key);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  async stream(key: string) {
    const { stream, size } = await this.openStream(key);
    return { stream, size };
  }

  /** Shared by read() and stream(): one authenticated fetch of the blob. */
  private async openStream(key: string) {
    this.assertKey(key);

    const result = await this.withAccess((access) =>
      get(key, { access }).then((value) => {
        if (!value) throw new Error(`Blob not found: ${key}`);
        return value;
      }),
    );

    const { Readable } = await import("node:stream");
    const size = Number(result.headers?.get("content-length") ?? 0);

    return {
      stream: Readable.fromWeb(
        result.stream as Parameters<typeof Readable.fromWeb>[0],
      ),
      size: Number.isFinite(size) ? size : 0,
    };
  }

  async delete(key: string): Promise<void> {
    this.assertKey(key);
    await del(key);
  }

  async exists(key: string): Promise<boolean> {
    try {
      this.assertKey(key);
      await head(key);
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
