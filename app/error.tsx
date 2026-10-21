"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Error boundary for the public site. Keeps the brand voice, offers a retry,
 * and never shows stack traces or internal messages to a visitor.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest links this page to the server log entry.
    console.error("Unhandled error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="container-page flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow text-gold-deep">Something went wrong</p>
      <h1 className="mt-5 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
        We have hit a flaw in the stone
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
        This page could not be loaded. Try again — and if it keeps happening,
        message us on WhatsApp and we will sort it out.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xs bg-ink px-6 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-cream transition-colors hover:bg-ink-soft"
        >
          <RefreshCw className="h-4 w-4" strokeWidth={1.6} />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xs border border-line-strong px-6 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
        >
          Back to home
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-10 text-[0.66rem] uppercase tracking-[0.16em] text-muted/70">
          Reference {error.digest}
        </p>
      ) : null}
    </div>
  );
}
