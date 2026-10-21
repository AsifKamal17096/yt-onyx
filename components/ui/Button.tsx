import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "gold" | "outline" | "ghost" | "whatsapp";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2.5 font-sans text-[0.78rem] font-medium uppercase tracking-[0.18em] transition-all duration-300 ease-[var(--ease-brand)] disabled:pointer-events-none disabled:opacity-45 rounded-xs";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-cream hover:bg-ink-soft hover:shadow-[0_10px_30px_-12px_rgba(10,10,10,0.6)]",
  gold: "bg-gold text-ink hover:bg-gold-soft",
  outline:
    "border border-line-strong bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-cream",
  ghost: "bg-transparent text-ink hover:text-gold-deep",
  // WhatsApp green, kept muted so it still sits inside the brand palette.
  whatsapp: "bg-[#1f7a55] text-white hover:bg-[#17603f]",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-[0.7rem]",
  md: "h-11 px-6",
  lg: "h-13 px-8",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof CommonProps> & {
    href?: undefined;
  };

type AnchorProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"a">, keyof CommonProps> & {
    href: string;
    /** Force an external anchor for links that leave the site. */
    external?: boolean;
  };

/**
 * The one button in the system. Renders an <a> when `href` is given — Next's
 * Link for internal routes, a plain anchor for external ones.
 */
export function Button(props: ButtonProps | AnchorProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className,
    children,
    ...rest
  } = props;

  const classes = cn(
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth && "w-full",
    className,
  );

  if (rest.href !== undefined) {
    const { href, external, ...anchorProps } = rest as Omit<
      AnchorProps,
      keyof CommonProps
    >;

    if (external || /^(https?:|mailto:|tel:)/.test(href)) {
      return (
        <a
          {...anchorProps}
          href={href}
          className={classes}
          target={anchorProps.target ?? "_blank"}
          rel={anchorProps.rel ?? "noopener noreferrer"}
        >
          {children}
        </a>
      );
    }

    return (
      <Link {...anchorProps} href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      {...(rest as Omit<ButtonProps, keyof CommonProps>)}
      className={classes}
    >
      {children}
    </button>
  );
}
