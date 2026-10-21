/**
 * Shared CSRF names.
 *
 * Kept in their own module because the form components are client-side, the
 * proxy runs before the app, and lib/csrf.ts is server-only.
 */
export const CSRF_FIELD = "csrf_token";
export const CSRF_COOKIE = "yt_c";
