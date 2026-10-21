import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * Next.js inlines small bootstrap scripts and the streamed RSC payload, so a
 * nonce-free policy needs 'unsafe-inline' for scripts; adding nonces would
 * force every page to render dynamically and cost us the static shells. The
 * clauses that actually block the common attacks — object-src, base-uri,
 * form-action and frame-ancestors — are locked down regardless.
 *
 * frame-src allows the optional Google Maps embed on the contact page.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
  "connect-src 'self'",
  "frame-src https://www.google.com https://maps.google.com",
  "manifest-src 'self'",
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Ignored over plain HTTP, so it is safe to send everywhere.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Cache Components: pages prerender a static shell and stream the dynamic
  // parts. Catalogue reads are wrapped in `use cache` + cacheTag, so admin
  // edits revalidate exactly the pages they affect.
  cacheComponents: true,
  partialPrefetching: true,

  // Native and binary-heavy packages must stay outside the server bundle.
  serverExternalPackages: ["sharp", "archiver"],

  poweredByHeader: false,

  images: {
    // Product images are already WebP, served from /api/media on a VPS or
    // straight from Vercel Blob in production.
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [96, 160, 240, 320],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
