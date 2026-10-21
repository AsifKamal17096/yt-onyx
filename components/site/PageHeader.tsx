import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Consistent masthead for the editorial pages. */
export function PageHeader({
  eyebrow,
  title,
  intro,
  breadcrumb,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  breadcrumb?: string;
}) {
  return (
    <header className="border-b border-line bg-cream-dim/40">
      <div className="container-page py-12 sm:py-16">
        {breadcrumb ? (
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[0.66rem] uppercase tracking-[0.16em] text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              <li aria-current="page" className="text-ink">
                {breadcrumb}
              </li>
            </ol>
          </nav>
        ) : null}
        <p className="eyebrow mt-5 text-gold-deep">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-[1.1] sm:text-5xl">
          {title}
        </h1>
        {intro ? (
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">
            {intro}
          </p>
        ) : null}
      </div>
    </header>
  );
}
