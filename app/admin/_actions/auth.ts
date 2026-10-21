"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  hashPassword,
  requireAdmin,
  setDatabasePassword,
  verifyCredentials,
} from "@/lib/auth";
import { ADMIN_BASE } from "@/lib/admin-path";
import { assertCsrf } from "@/lib/csrf";
import { endSession, startSession } from "@/lib/session";
import { fieldErrors, type ActionState } from "@/lib/action-state";
import { visitorFromHeaders } from "@/lib/request-info";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const LoginSchema = z.object({
  email: z.string().min(3, "Enter your email").max(200),
  password: z.string().min(1, "Enter your password").max(200),
});

/** Only ever redirect to a path inside the admin. */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith(`${ADMIN_BASE}/`)) return ADMIN_BASE;
  if (value.includes("//") || value.includes("..")) return ADMIN_BASE;
  return value;
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await assertCsrf(formData);
  } catch {
    return {
      ok: false,
      message: "Your session expired. Reload the page and try again.",
    };
  }

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error.issues) };
  }

  const { ipHash } = visitorFromHeaders(await headers());
  const outcome = await verifyCredentials(
    parsed.data.email,
    parsed.data.password,
    ipHash,
  );

  if (!outcome.ok) {
    if (outcome.reason === "locked") {
      return {
        ok: false,
        message: `Too many attempts. Try again in ${outcome.retryInMinutes} minutes.`,
      };
    }
    if (outcome.reason === "not_configured") {
      return {
        ok: false,
        message:
          "No administrator account is configured. Set ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env.",
      };
    }
    // Deliberately vague: never reveal which half was wrong.
    return { ok: false, message: "Those details do not match." };
  }

  await startSession(parsed.data.email);

  // redirect() signals by throwing, so it must sit outside any try/catch.
  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function logoutAction(formData: FormData): Promise<void> {
  await assertCsrf(formData);
  await endSession();
  redirect(`${ADMIN_BASE}/login`);
}

const PasswordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z
      .string()
      .min(10, "Use at least 10 characters")
      .max(200, "That is too long"),
    confirm: z.string().min(1, "Repeat the new password"),
  })
  .refine((data) => data.next === data.confirm, {
    path: ["confirm"],
    message: "The two passwords do not match",
  });

export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireAdmin();

  try {
    await assertCsrf(formData);
  } catch {
    return { ok: false, message: "Reload the page and try again." };
  }

  const parsed = PasswordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error.issues) };
  }

  // Re-check the current password against whichever hash is in force.
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { adminPasswordHash: true },
  });
  const activeHash =
    settings?.adminPasswordHash?.trim() ||
    process.env.ADMIN_PASSWORD_HASH?.trim();

  if (!activeHash || !(await bcrypt.compare(parsed.data.current, activeHash))) {
    return { ok: false, errors: { current: "That is not your current password" } };
  }

  await setDatabasePassword(await hashPassword(parsed.data.next));

  // Everything else about the session stays valid; the email is unchanged.
  return {
    ok: true,
    message: `Password updated for ${session.email}.`,
  };
}
