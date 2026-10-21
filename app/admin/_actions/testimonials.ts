"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { revalidateTestimonials } from "@/lib/revalidate";
import { fieldErrors, type ActionState } from "@/lib/action-state";

/**
 * Testimonials shown on the home page.
 *
 * Deliberately plain text rather than a rating system: the home page prints
 * the words, the name and where the customer is, and nothing else.
 */

const TestimonialSchema = z.object({
  quote: z
    .string()
    .trim()
    .min(20, "A testimonial needs a sentence or two")
    .max(600, "Keep it under 600 characters so the three cards stay even"),
  name: z
    .string()
    .trim()
    .min(2, "Who said it? A first name or a description is enough")
    .max(80),
  location: z.string().trim().min(2, "Where are they?").max(80),
});

export async function saveTestimonialAction(
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
  const parsed = TestimonialSchema.safeParse({
    quote: formData.get("quote"),
    name: formData.get("name"),
    location: formData.get("location"),
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error.issues) };
  }

  const published = formData.get("published") === "on";

  if (id) {
    await prisma.testimonial.update({
      where: { id },
      data: { ...parsed.data, published },
    });
    revalidateTestimonials();
    return { ok: true, message: "Testimonial saved." };
  }

  const last = await prisma.testimonial.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.testimonial.create({
    data: {
      ...parsed.data,
      published,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });

  revalidateTestimonials();
  return { ok: true, message: "Testimonial added." };
}

export async function deleteTestimonialAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.testimonial.delete({ where: { id } }).catch(() => undefined);
  revalidateTestimonials();
}

export async function moveTestimonialAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const rows = await prisma.testimonial.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  const index = rows.findIndex((row) => row.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return;

  const reordered = [...rows];
  reordered.splice(target, 0, reordered.splice(index, 1)[0]!);

  // Rewrite the whole sequence so the numbers never drift apart.
  await prisma.$transaction(
    reordered.map((row, position) =>
      prisma.testimonial.update({
        where: { id: row.id },
        data: { sortOrder: position },
      }),
    ),
  );

  revalidateTestimonials();
}
