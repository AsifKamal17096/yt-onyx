import type { SVGProps } from "react";

/**
 * Brand glyphs drawn inline so no icon font or extra request is needed.
 * UI icons (menu, close, chevrons…) come from lucide-react.
 */

type IconProps = SVGProps<SVGSVGElement>;

export function WhatsAppIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.38-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.69.25-1.29.18-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.8c2.17 0 4.2.84 5.73 2.38a8.07 8.07 0 0 1 2.38 5.73c0 4.47-3.64 8.11-8.11 8.11a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.07.81.82-3-.19-.31a8.06 8.06 0 0 1-1.24-4.3c0-4.47 3.64-8.11 8.11-8.11z" />
    </svg>
  );
}

export function InstagramIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.54-1.5h1.66V3.6c-.29-.04-1.27-.12-2.42-.12-2.4 0-4.04 1.46-4.04 4.15V9.9H7.5V13h2.74v8h3.26z" />
    </svg>
  );
}

export function PinterestIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M12 2a10 10 0 0 0-3.65 19.32c-.05-.78-.1-1.98.02-2.83.11-.78.72-4.95.72-4.95s-.18-.37-.18-.92c0-.86.5-1.5 1.12-1.5.53 0 .78.4.78.87 0 .53-.34 1.33-.51 2.07-.15.62.31 1.13.92 1.13 1.1 0 1.95-1.17 1.95-2.85 0-1.49-1.07-2.53-2.6-2.53-1.77 0-2.81 1.33-2.81 2.7 0 .53.2 1.11.46 1.42.05.06.06.12.04.19l-.17.71c-.03.11-.09.14-.21.08-1.03-.48-1.67-1.98-1.67-3.19 0-2.6 1.89-4.98 5.44-4.98 2.86 0 5.08 2.04 5.08 4.76 0 2.84-1.79 5.12-4.27 5.12-.83 0-1.62-.43-1.89-.95l-.51 1.96c-.19.72-.69 1.61-1.03 2.16A10 10 0 1 0 12 2z" />
    </svg>
  );
}

export function TikTokIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.1v12.4a2.59 2.59 0 1 1-1.84-2.48v-3.1a5.66 5.66 0 1 0 4.94 5.6V8.9a7.33 7.33 0 0 0 4.28 1.37V7.17a4.28 4.28 0 0 1-3.22-1.35z" />
    </svg>
  );
}
