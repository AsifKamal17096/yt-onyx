import "server-only";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { ADMIN_BASE } from "@/lib/admin-path";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/**
 * Single-admin authentication.
 *
 * The account is defined by ADMIN_EMAIL and ADMIN_PASSWORD_HASH in .env.
 * A hash set later from the "Change password" page is stored in SiteSettings
 * and takes precedence, so the owner can rotate their password without
 * touching the server — `npm run admin:reset-db-password` falls back to .env
 * if they are ever locked out.
 */

/** 5 failed attempts per IP in 15 minutes locks login for the rest of them. */
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export class NotAuthorizedError extends Error {
  constructor() {
    super("Not authorized");
    this.name = "NotAuthorizedError";
  }
}

/** The password hash currently in force (database first, then environment). */
async function activePasswordHash(): Promise<string | null> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: 1 },
    select: { adminPasswordHash: true },
  });

  const stored = settings?.adminPasswordHash?.trim();
  if (stored) return stored;

  const fromEnv = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (!fromEnv) return null;

  // .env expands $VAR, so an unescaped bcrypt hash arrives here in pieces.
  // Catching it explicitly turns a baffling "wrong password" into a fixable
  // message (see .env.example and `npm run admin:hash`).
  if (!/^\$2[aby]\$\d{2}\$/.test(fromEnv)) {
    console.error(
      "ADMIN_PASSWORD_HASH does not look like a bcrypt hash. Escape every $ " +
        "as \$ in .env, or re-run `npm run admin:hash`.",
    );
    return null;
  }

  return fromEnv;
}

/** Length-independent string comparison, so email checks leak no timing. */
function constantTimeEquals(a: string, b: string): boolean {
  const bufferA = crypto.createHash("sha256").update(a).digest();
  const bufferB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(bufferA, bufferB);
}

export type LoginOutcome =
  | { ok: true }
  | { ok: false; reason: "invalid" | "locked" | "not_configured"; retryInMinutes?: number };

/** Recent failures for this visitor, used for the lockout. */
export async function failedAttemptCount(ipHash: string): Promise<number> {
  return prisma.loginAttempt.count({
    where: {
      ipHash,
      success: false,
      createdAt: { gte: new Date(Date.now() - LOGIN_WINDOW_MS) },
    },
  });
}

export async function recordAttempt(
  ipHash: string,
  success: boolean,
): Promise<void> {
  await prisma.loginAttempt.create({ data: { ipHash, success } });

  // Opportunistic cleanup; the table is never meant to grow.
  if (Math.random() < 0.1) {
    await prisma.loginAttempt.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });
  }
}

/**
 * Checks credentials against the configured account.
 *
 * A bcrypt comparison always runs, even when the email is wrong or no hash is
 * configured, so the response time cannot be used to discover the email.
 */
export async function verifyCredentials(
  email: string,
  password: string,
  ipHash: string,
): Promise<LoginOutcome> {
  const failures = await failedAttemptCount(ipHash);
  if (failures >= MAX_LOGIN_ATTEMPTS) {
    return {
      ok: false,
      reason: "locked",
      retryInMinutes: Math.ceil(LOGIN_WINDOW_MS / 60000),
    };
  }

  const configuredEmail = process.env.ADMIN_EMAIL?.trim();
  const hash = await activePasswordHash();

  // A dummy hash of the right shape keeps the timing identical when the
  // account is not configured or the email does not match.
  const DUMMY =
    "$2b$12$C6UzMDM.H6dfI/f/IKcEe.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

  const emailMatches = Boolean(
    configuredEmail &&
      constantTimeEquals(
        configuredEmail.toLowerCase(),
        email.trim().toLowerCase(),
      ),
  );

  const passwordMatches = await bcrypt.compare(password, hash ?? DUMMY);

  if (!configuredEmail || !hash) {
    await recordAttempt(ipHash, false);
    return { ok: false, reason: "not_configured" };
  }

  if (!emailMatches || !passwordMatches) {
    await recordAttempt(ipHash, false);
    return { ok: false, reason: "invalid" };
  }

  await recordAttempt(ipHash, true);
  return { ok: true };
}

/** Hashes a new password for storage. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function setDatabasePassword(hash: string): Promise<void> {
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: { adminPasswordHash: hash },
    create: { id: 1, adminPasswordHash: hash },
  });
}

/**
 * Guard for every admin server action and API route.
 *
 * The proxy already blocks unauthenticated requests to admin pages, but a
 * server action is reachable by URL on its own, so each one re-checks.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new NotAuthorizedError();
  return session;
}

/**
 * Guard for admin *pages*: sends the visitor to the login screen instead of
 * throwing. The proxy normally catches this first; this is the second lock.
 */
export async function requireAdminPage() {
  const session = await getSession();
  if (!session) redirect(`${ADMIN_BASE}/login`);
  return session;
}
