import type { ReactNode, SelectHTMLAttributes } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Form primitives for the admin. Plain, dense and consistent — these are
 * working controls, not showroom pieces.
 */

const CONTROL =
  "w-full border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-gold disabled:bg-cream-dim/60 disabled:text-muted";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[0.66rem] font-medium uppercase tracking-[0.16em] text-muted"
      >
        {label}
        {required ? <span className="ml-1 text-gold-deep">*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-xs leading-relaxed text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs leading-relaxed text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, className)} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(CONTROL, "min-h-28 resize-y leading-relaxed", className)}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(CONTROL, "pr-8", className)}>
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 border border-line bg-white px-3 py-2.5",
        className,
      )}
    >
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 h-4 w-4 accent-[#0A0A0A]"
      />
      <span>
        <span className="block text-sm text-ink">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

/** Groups a set of fields under a heading inside a form. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("border border-line bg-white p-5 sm:p-6", className)}
    >
      <h2 className="font-serif text-xl">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
