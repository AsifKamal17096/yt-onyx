"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Submit button that disables itself and shows a spinner while the server
 * action it belongs to is running.
 */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className,
  ...props
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "outline" | "danger";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2.5 rounded-xs px-6 text-[0.72rem] font-medium uppercase tracking-[0.16em] transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" && "bg-ink text-cream hover:bg-ink-soft",
        variant === "outline" &&
          "border border-line-strong text-ink hover:border-ink",
        variant === "danger" && "bg-red-700 text-white hover:bg-red-800",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
          {pendingLabel ?? "Saving…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}
