import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

/**
 * Admin sessions: a signed JWT in an httpOnly cookie.
 *
 * There is no session table — with exactly one account, a signed token is
 * enough, and rotating SESSION_SECRET invalidates every open session.
 *
 * The cookie name is deliberately neutral: nothing a visitor can observe
 * should hint that an admin area exists.
 */

const COOKIE_NAME = "yt_s";
const ISSUER = "yt-onyx";
const AUDIENCE = "yt-onyx-admin";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export type AdminSession = {
  email: string;
  issuedAt: number;
};

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short (needs 32+ characters). Run `npm run secret`.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<AdminSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (typeof payload.email !== "string") return null;

    return { email: payload.email, issuedAt: payload.iat ?? 0 };
  } catch {
    // Expired, tampered with, or signed under an older secret.
    return null;
  }
}

/** Writes the session cookie. Called from the login action only. */
export async function startSession(email: string): Promise<void> {
  const token = await createSessionToken(email);
  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

/** Reads and verifies the session from the incoming request's cookies. */
export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE_NAME)?.value);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
