import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Standard admin page header: title, optional description and actions. */
export function AdminPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-5 sm:p-8", className)}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex gap-3">{actions}</div> : null}
      </header>

      <div className="mt-7">{children}</div>
    </div>
  );
}

/** Plain link styled as an admin action button. */
export function AdminLinkButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "outline";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-xs px-5 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors",
        variant === "primary"
          ? "bg-ink text-cream hover:bg-ink-soft"
          : "border border-line-strong text-ink hover:border-ink",
      )}
    >
      {children}
    </Link>
  );
}

/** Empty-state block for lists with nothing in them yet. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line bg-white px-6 py-16 text-center">
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
