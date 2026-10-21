import Link from "next/link";
import { Button } from "@/components/ui/Button";

/** Shared body of the 404 page, used with and without the site chrome. */
export function NotFoundContent() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow text-gold-deep">404</p>
      <h1 className="mt-5 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
        This page has been cut from the block
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
        The page you were looking for is not here. It may have been renamed, or
        the piece may have sold and been retired from the collection.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Button href="/shop" size="lg">
          Browse the collection
        </Button>
        <Button href="/" variant="outline" size="lg">
          Back to home
        </Button>
      </div>
      <p className="mt-10 text-xs text-muted">
        Looking for something specific?{" "}
        <Link
          href="/contact"
          className="underline underline-offset-4 transition-colors hover:text-ink"
        >
          Ask us on WhatsApp
        </Link>
        .
      </p>
    </section>
  );
}
