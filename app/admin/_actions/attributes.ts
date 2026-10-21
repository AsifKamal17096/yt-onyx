"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { revalidateAttributes } from "@/lib/revalidate";
import { slugify } from "@/lib/slug";

/**
 * Stone types, colours and finishes.
 *
 * All three behave identically, so one set of actions handles them with a
 * `kind` discriminator rather than three near-identical files.
 */

const KINDS = ["stone", "color", "finish"] as const;
type Kind = (typeof KINDS)[number];

const Schema = z.object({
  kind: z.enum(KINDS),
  name: z.string().trim().min(1).max(60),
  hex: z
    .string()
    .trim()
    .regex(/^#?[0-9a-fA-F]{6}$/, "Use a hex colour like #B8935A")
    .optional()
    .or(z.literal("")),
});

/**
 * Existence + ordering lookups per kind. The three Prisma models have
 * different generated types, so each branch is queried on its own rather than
 * through a shared delegate reference.
 */
async function slugTaken(kind: Kind, slug: string): Promise<boolean> {
  if (kind === "stone") {
    return Boolean(await prisma.stoneType.findUnique({ where: { slug } }));
  }
  if (kind === "color") {
    return Boolean(await prisma.color.findUnique({ where: { slug } }));
  }
  return Boolean(await prisma.finish.findUnique({ where: { slug } }));
}

async function nextSortOrder(kind: Kind): Promise<number> {
  const select = { sortOrder: true } as const;
  const orderBy = { sortOrder: "desc" } as const;

  const last =
    kind === "stone"
      ? await prisma.stoneType.findFirst({ orderBy, select })
      : kind === "color"
        ? await prisma.color.findFirst({ orderBy, select })
        : await prisma.finish.findFirst({ orderBy, select });

  return (last?.sortOrder ?? -1) + 1;
}

export async function createAttributeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const parsed = Schema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    hex: formData.get("hex") ?? "",
  });
  if (!parsed.success) return;

  const { kind, name, hex } = parsed.data;
  const slug = slugify(name);
  if (!slug) return;

  if (await slugTaken(kind, slug)) return;

  const sortOrder = await nextSortOrder(kind);

  if (kind === "color") {
    await prisma.color.create({
      data: {
        name,
        slug,
        sortOrder,
        hex: hex ? (hex.startsWith("#") ? hex : `#${hex}`) : null,
      },
    });
  } else if (kind === "stone") {
    await prisma.stoneType.create({ data: { name, slug, sortOrder } });
  } else {
    await prisma.finish.create({ data: { name, slug, sortOrder } });
  }

  revalidateAttributes();
}

export async function renameAttributeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const parsed = Schema.safeParse({
    kind: formData.get("kind"),
    name: formData.get("name"),
    hex: formData.get("hex") ?? "",
  });
  const id = String(formData.get("id") ?? "");
  if (!parsed.success || !id) return;

  const { kind, name, hex } = parsed.data;

  // The slug stays put: it is part of shop filter URLs people may have saved.
  if (kind === "color") {
    await prisma.color.update({
      where: { id },
      data: {
        name,
        hex: hex ? (hex.startsWith("#") ? hex : `#${hex}`) : null,
      },
    });
  } else if (kind === "stone") {
    await prisma.stoneType.update({ where: { id }, data: { name } });
  } else {
    await prisma.finish.update({ where: { id }, data: { name } });
  }

  revalidateAttributes();
}

export async function deleteAttributeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const kind = String(formData.get("kind") ?? "") as Kind;
  const id = String(formData.get("id") ?? "");
  if (!KINDS.includes(kind) || !id) return;

  // Products keep a nullable reference, so deleting simply clears the field.
  if (kind === "color") {
    await prisma.product.updateMany({ where: { colorId: id }, data: { colorId: null } });
    await prisma.color.delete({ where: { id } });
  } else if (kind === "stone") {
    await prisma.product.updateMany({
      where: { stoneTypeId: id },
      data: { stoneTypeId: null },
    });
    await prisma.stoneType.delete({ where: { id } });
  } else {
    await prisma.product.updateMany({
      where: { finishId: id },
      data: { finishId: null },
    });
    await prisma.finish.delete({ where: { id } });
  }

  revalidateAttributes();
}
