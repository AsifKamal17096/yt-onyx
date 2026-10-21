"use server";

import { requireAdmin } from "@/lib/auth";
import { seedCatalogue } from "@/lib/catalog-seed";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { revalidateEverything } from "@/lib/revalidate";
import { storage, usingBlobStorage } from "@/lib/storage";
import type { ActionState } from "@/lib/action-state";

/**
 * First-run setup.
 *
 * Creates the categories, attribute lists, settings row, testimonials and the
 * demo catalogue — the same work `npm run seed` does, but from inside the
 * admin, because a site deployed to a serverless host has no shell and
 * copying production database credentials onto a laptop to run a script is a
 * poor trade.
 *
 * It refuses to run once there are products, so it cannot be used to undo
 * real work by accident. The time budget it needs is declared on the
 * dashboard route, since a "use server" file may only export async functions.
 */

/** Confirms images can actually be written before generating sixteen of them. */
async function storageWorks(): Promise<string | null> {
  const key = `setup-check/${Date.now().toString(36)}.webp`;
  // A one-pixel WebP: the smallest thing that proves a round trip.
  const probe = Buffer.from(
    "UklGRhwAAABXRUJQVlA4TBAAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
    "base64",
  );

  try {
    await storage.save(key, probe);
    const back = await storage.read(key);
    await storage.delete(key).catch(() => undefined);
    if (back.length === 0) return "the file came back empty";
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "unknown error";
  }
}

export async function setupCatalogueAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  try {
    await assertCsrf(formData);
  } catch {
    return { ok: false, message: "Reload the page and try again." };
  }

  const existing = await prisma.product.count();
  if (existing > 0) {
    return {
      ok: false,
      message: `There are already ${existing} products. Setup only runs on an empty catalogue.`,
    };
  }

  const storageProblem = await storageWorks();
  if (storageProblem) {
    return {
      ok: false,
      message:
        `Images cannot be saved, so setup stopped before creating anything. ` +
        `Storage is ${usingBlobStorage ? "Vercel Blob" : "the local uploads folder"} ` +
        `and it reported: ${storageProblem}`,
    };
  }

  const steps: string[] = [];

  try {
    const result = await seedCatalogue((message) => steps.push(message));
    revalidateEverything();

    return {
      ok: true,
      message:
        `Created ${result.categories} categories and ${result.products} products ` +
        `with ${result.images} images, stored in ` +
        `${usingBlobStorage ? "Vercel Blob" : "the local uploads folder"}.`,
    };
  } catch (error) {
    // Partial progress is kept: everything is upserted, so pressing the
    // button again continues where it stopped.
    return {
      ok: false,
      message:
        `Setup stopped after ${steps.length} steps: ` +
        (error instanceof Error ? error.message : "unknown error") +
        ". Press the button again to continue.",
    };
  }
}
