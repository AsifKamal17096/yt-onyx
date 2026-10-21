"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { ADMIN_BASE } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { revalidateCategories } from "@/lib/revalidate";
import { uniqueSlug } from "@/lib/slug";
import { storage } from "@/lib/storage";
import { fieldErrors, type ActionState } from "@/lib/action-state";

const CategorySchema = z.object({
  name: z.string().trim().min(2, "Give the category a name").max(80),
  slug: z.string().trim().max(90).optional(),
  description: z.string().trim().max(1000).optional(),
  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(400).optional(),
});

function readForm(formData: FormData) {
  const value = (key: string) => String(formData.get(key) ?? "");
  return {
    name: value("name"),
    slug: value("slug"),
    description: value("description"),
    seoTitle: value("seoTitle"),
    seoDescription: value("seoDescription"),
  };
}

export async function saveCategoryAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  try {
    await assertCsrf(formData);
  } catch {
    return { ok: false, message: "Reload the page and try again." };
  }

  const id = String(formData.get("id") ?? "").trim() || null;
  const parsed = CategorySchema.safeParse(readForm(formData));

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error.issues) };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.slug || data.name, async (candidate) => {
    const row = await prisma.category.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(row) && row!.id !== id;
  });

  const values = {
    name: data.name,
    slug,
    description: data.description || null,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };

  if (id) {
    const previous = await prisma.category.findUnique({
      where: { id },
      select: { slug: true },
    });
    await prisma.category.update({ where: { id }, data: values });
    revalidateCategories([slug, previous?.slug].filter(Boolean) as string[]);
    return { ok: true, message: "Category saved." };
  }

  const last = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.category.create({
    data: { ...values, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });

  revalidateCategories([slug]);
  redirect(`${ADMIN_BASE}/categories`);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const category = await prisma.category.findUnique({
    where: { id },
    select: {
      slug: true,
      imageKey: true,
      _count: { select: { products: true } },
    },
  });

  // Products hold a required categoryId, so a category in use cannot go.
  if (!category || category._count.products > 0) {
    redirect(`${ADMIN_BASE}/categories?error=in-use`);
  }

  await prisma.category.delete({ where: { id } });
  if (category.imageKey) await storage.delete(category.imageKey).catch(() => {});

  revalidateCategories([category.slug]);
  redirect(`${ADMIN_BASE}/categories?deleted=1`);
}

export async function moveCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  const index = categories.findIndex((category) => category.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= categories.length) return;

  const reordered = [...categories];
  reordered.splice(target, 0, reordered.splice(index, 1)[0]!);

  // Rewrite the whole sequence so the numbers never drift apart.
  await prisma.$transaction(
    reordered.map((category, position) =>
      prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: position },
      }),
    ),
  );

  revalidateCategories();
}
