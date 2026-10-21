import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** Eyebrow + serif heading + optional "view all" link, used by every section. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  align = "left",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className,
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {eyebrow ? (
          <p className={cn("eyebrow", dark ? "text-gold" : "text-gold-deep")}>
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "mt-3 max-w-2xl font-serif text-3xl leading-[1.15] sm:text-4xl",
            dark ? "text-cream" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mt-4 max-w-xl text-sm leading-relaxed",
              dark ? "text-cream/65" : "text-muted",
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {href ? (
        <Link
          href={href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 text-[0.72rem] uppercase tracking-[0.2em] transition-colors",
            dark
              ? "text-cream/70 hover:text-gold"
              : "text-muted hover:text-gold-deep",
          )}
        >
          {linkLabel}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
            strokeWidth={1.5}
          />
        </Link>
      ) : null}
    </div>
  );
}
