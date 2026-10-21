import "server-only";

/**
 * Request-time date helpers.
 *
 * Reading the clock is deliberately isolated here: admin pages are dynamic by
 * nature (they read the session cookie), but a bare `Date.now()` inside a
 * component body is flagged as impure, and under Cache Components it would be
 * a prerender hazard anywhere else.
 */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}
