"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { assertCsrf } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { revalidateSettings } from "@/lib/revalidate";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { fieldErrors, type ActionState } from "@/lib/action-state";

const optionalUrl = z
  .string()
  .trim()
  .max(400)
  .refine(
    (value) => value === "" || /^https?:\/\//i.test(value),
    "Use a full address starting with https://",
  )
  .transform((value) => (value === "" ? null : value));

const SettingsSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .max(40)
    .refine(
      (value) => value === "" || normalizeWhatsAppNumber(value) !== null,
      "Enter a full number with country code, e.g. +92 300 1234567",
    )
    .transform((value) => (value === "" ? null : value)),
  whatsappTemplate: z
    .string()
    .trim()
    .min(10, "The message template cannot be empty")
    .max(1500),
  heroHeadline: z.string().trim().min(3, "The hero needs a headline").max(160),
  heroSubtext: z.string().trim().max(400),
  announcement: z.string().trim().max(200).transform((v) => (v === "" ? null : v)),
  contactEmail: z
    .string()
    .trim()
    .max(200)
    .refine(
      (value) => value === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),
      "Enter a valid email address",
    ),
  contactPhone: z.string().trim().max(40).transform((v) => (v === "" ? null : v)),
  addressLine: z.string().trim().max(300),
  mapEmbedUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  pinterestUrl: optionalUrl,
  tiktokUrl: optionalUrl,
});

export async function saveSettingsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  try {
    await assertCsrf(formData);
  } catch {
    return { ok: false, message: "Reload the page and try again." };
  }

  const value = (key: string) => String(formData.get(key) ?? "");

  const parsed = SettingsSchema.safeParse({
    whatsappNumber: value("whatsappNumber"),
    whatsappTemplate: value("whatsappTemplate"),
    heroHeadline: value("heroHeadline"),
    heroSubtext: value("heroSubtext"),
    announcement: value("announcement"),
    contactEmail: value("contactEmail"),
    contactPhone: value("contactPhone"),
    addressLine: value("addressLine"),
    mapEmbedUrl: value("mapEmbedUrl"),
    instagramUrl: value("instagramUrl"),
    facebookUrl: value("facebookUrl"),
    pinterestUrl: value("pinterestUrl"),
    tiktokUrl: value("tiktokUrl"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Some fields need attention.",
      errors: fieldErrors(parsed.error.issues),
    };
  }

  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: parsed.data,
    create: { id: 1, ...parsed.data },
  });

  // Every WhatsApp button, the header and the footer read these values.
  revalidateSettings();

  return { ok: true, message: "Settings saved." };
}

/** Clears an uploaded hero image or logo and falls back to the defaults. */
export async function clearSettingsImageAction(
  formData: FormData,
): Promise<void> {
  await requireAdmin();
  await assertCsrf(formData);

  const field = String(formData.get("field") ?? "");
  if (field !== "heroImageKey" && field !== "logoKey") return;

  await prisma.siteSettings.update({
    where: { id: 1 },
    data: { [field]: null },
  });

  revalidateSettings();
}
