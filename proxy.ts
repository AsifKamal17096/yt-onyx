import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SEGMENT } from "@/lib/admin-path";
import { CSRF_COOKIE } from "@/lib/csrf-field";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

/**
 * Request gate for the admin area (Next 16 renamed Middleware to Proxy).
 *
 * Four jobs:
 *  1. Map the public path /<ADMIN_PATH>/… onto the real routes under /admin.
 *  2. Make the literal /admin path 404 when ADMIN_PATH has been customised,
 *     so the panel cannot be found by guessing.
 *  3. Bounce unauthenticated requests to the login page before any admin page
 *     renders, and mark every admin response noindex.
 *  4. Issue the CSRF cookie. Cookies cannot be written while a page renders,
 *     so it is minted here and injected into the forwarded request as well,
 *     which means the very first page load already has a usable token.
 *
 * Pages and server actions check the session again themselves — this layer is
 * about routing, not about being the only guard.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segment = ADMIN_SEGMENT;
  const adminPrefix = `/${segment}`;

  // The default path must behave like any other missing page once a custom
  // one is in use.
  if (
    segment !== "admin" &&
    (pathname === "/admin" || pathname.startsWith("/admin/"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/this-page-does-not-exist";
    return NextResponse.rewrite(url);
  }

  const isAdminRequest =
    pathname === adminPrefix || pathname.startsWith(`${adminPrefix}/`);

  if (!isAdminRequest) return NextResponse.next();

  // --- CSRF token ---------------------------------------------------------
  const existingCsrf = request.cookies.get(CSRF_COOKIE)?.value;
  const csrf =
    existingCsrf && existingCsrf.length === 64
      ? existingCsrf
      : crypto.randomBytes(32).toString("hex");
  const csrfIsNew = csrf !== existingCsrf;

  const attachCsrf = (response: NextResponse) => {
    if (csrfIsNew) {
      response.cookies.set(CSRF_COOKIE, csrf, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  };

  // --- session ------------------------------------------------------------
  const internalPath =
    pathname === adminPrefix
      ? "/admin"
      : `/admin${pathname.slice(adminPrefix.length)}`;

  const isLoginPage = internalPath === "/admin/login";
  const session = await verifySessionToken(
    request.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  if (!session && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = `${adminPrefix}/login`;
    url.search = "";
    // Remember where they were heading, but only as a safe internal path.
    if (pathname !== adminPrefix) url.searchParams.set("next", pathname);
    return attachCsrf(NextResponse.redirect(url));
  }

  if (session && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = adminPrefix;
    url.search = "";
    return attachCsrf(NextResponse.redirect(url));
  }

  // Forward the token on the request too, so the first render can read it.
  const requestHeaders = new Headers(request.headers);
  if (csrfIsNew) {
    const cookieHeader = request.headers.get("cookie");
    requestHeaders.set(
      "cookie",
      cookieHeader
        ? `${cookieHeader}; ${CSRF_COOKIE}=${csrf}`
        : `${CSRF_COOKIE}=${csrf}`,
    );
  }

  const url = request.nextUrl.clone();
  url.pathname = internalPath;

  return attachCsrf(
    NextResponse.rewrite(url, { request: { headers: requestHeaders } }),
  );
}

export const config = {
  // Everything except static assets and the public media route, which can
  // never be admin paths.
  matcher: [
    "/((?!_next/static|_next/image|api/media|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
