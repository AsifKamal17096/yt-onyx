import { rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { PassThrough, Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";
import { ZipArchive } from "archiver";
import { NotAuthorizedError, requireAdmin } from "@/lib/auth";
import { resolveDatabaseUrl } from "@/lib/database-url";
import { prisma } from "@/lib/prisma";
import { uploadsRoot } from "@/lib/storage";

/**
 * Downloads a zip containing the database and the uploads folder.
 *
 * The database is copied with SQLite's VACUUM INTO rather than by reading the
 * file directly: that produces a consistent snapshot even if a write happens
 * mid-backup, and it compacts the file at the same time.
 */
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

  let snapshotPath: string | null = null;
  const databaseUrl = resolveDatabaseUrl();

  if (databaseUrl.startsWith("file:")) {
    snapshotPath = path.join(
      os.tmpdir(),
      `ytonyx-${crypto.randomBytes(6).toString("hex")}.db`,
    );
    // VACUUM INTO needs a literal path; the value is generated above, never
    // taken from the request.
    await prisma.$executeRawUnsafe(
      `VACUUM INTO '${snapshotPath.replace(/\\/g, "/").replace(/'/g, "''")}'`,
    );
    archive.file(snapshotPath, { name: "database/dev.db" });
  } else {
    archive.append(
      "This installation does not use SQLite. Back the database up with the tools for your database server (for example pg_dump).\n",
      { name: "database/README.txt" },
    );
  }

  const uploads = uploadsRoot();
  try {
    await stat(uploads);
    archive.directory(uploads, "uploads");
  } catch {
    archive.append("No uploads yet.\n", { name: "uploads/README.txt" });
  }

  archive.append(
    [
      `YT Onyx backup — ${new Date().toISOString()}`,
      "",
      "database/dev.db  SQLite snapshot (consistent copy via VACUUM INTO)",
      "uploads/         every processed product and site image",
      "",
      "To restore: stop the app, put dev.db back in prisma/ and the uploads",
      "folder back where UPLOADS_DIR points, then start the app again.",
      "",
    ].join("\n"),
    { name: "README.txt" },
  );

  void archive.finalize();

  // Remove the temporary snapshot once the archive has been written.
  archive.on("end", () => {
    if (snapshotPath) void rm(snapshotPath, { force: true });
  });

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
