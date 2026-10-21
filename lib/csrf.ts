import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";

/**
 * CSRF protection for admin mutations.
 *
 * Two independent checks, because neither is free of edge cases on its own:
 *
 *  1. A double-submit token: a random value in an httpOnly cookie that every
 *     admin form echoes back in a hidden field. A cross-site page cannot read
 *     the cookie, so it cannot produce a matching field.
 *  2. An Origin check against the request Host.
 *
 * Next.js also guards Server Actions by origin, so this is defence in depth
 * rather than the only barrier.
 */

import { CSRF_COOKIE, CSRF_FIELD } from "@/lib/csrf-field";

export { CSRF_FIELD };

export class CsrfError extends Error {
  constructor() {
    super("Request could not be verified. Please reload the page.");
    this.name = "CsrfError";
  }
}

/**
 * The token for the current browser, for embedding in an admin form.
 *
 * The cookie itself is minted by proxy.ts, because cookies cannot be written
 * during a page render. An empty string here means the request did not come
 * through the proxy, and any mutation it leads to will be rejected.
 */
export async function csrfToken(): Promise<string> {
  const store = await cookies();
  return store.get(CSRF_COOKIE)?.value ?? "";
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

/** Throws unless the submitted token matches the cookie and the origin fits. */
export async function assertCsrf(submitted: FormData | string): Promise<void> {
  const token =
    typeof submitted === "string"
      ? submitted
      : String(submitted.get(CSRF_FIELD) ?? "");

  const store = await cookies();
  const expected = store.get(CSRF_COOKIE)?.value;

  if (!token || !expected || !safeEquals(token, expected)) {
    throw new CsrfError();
  }

  const headerList = await headers();
  const origin = headerList.get("origin");

  if (origin) {
    const host = headerList.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      throw new CsrfError();
    }
    if (!host || originHost !== host) throw new CsrfError();
  }
}
