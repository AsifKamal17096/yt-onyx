"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";

/**
 * Submit button that asks first.
 *
 * It lives inside a form and submits it through a hidden submit button, so the
 * server action still receives the name/value pair and the whole thing keeps
 * working without JavaScript-driven state management.
 */
export function ConfirmButton({
  children,
  title,
  body,
  confirmLabel = "Delete",
  name,
  value,
  variant = "danger",
  className,
}: {
  children: React.ReactNode;
  title: string;
  body: string;
  confirmLabel?: string;
  name?: string;
  value?: string;
  variant?: "danger" | "outline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const hiddenSubmit = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={cn(
          "inline-flex h-9 items-center justify-center gap-2 rounded-xs px-3.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] transition-colors disabled:opacity-50",
          variant === "danger"
            ? "border border-red-200 text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-white"
            : "border border-line-strong text-ink hover:border-ink",
          className,
        )}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} />
        ) : null}
        {children}
      </button>

      <button
        ref={hiddenSubmit}
        type="submit"
        name={name}
        value={value}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md border border-line bg-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex gap-4">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                strokeWidth={1.6}
              />
              <div>
                <h2 className="font-serif text-xl text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 rounded-xs border border-line-strong px-5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors hover:border-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  hiddenSubmit.current?.click();
                }}
                className="h-10 rounded-xs bg-red-700 px-5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-red-800"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
