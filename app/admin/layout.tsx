import type { Metadata } from "next";
import { AdminPathProvider } from "@/components/admin/AdminPathProvider";
import { ToastProvider } from "@/components/admin/Toast";
import { ADMIN_BASE } from "@/lib/admin-path";

/**
 * Root of the admin area.
 *
 * Nothing here is ever linked from the public site, and every page carries
 * noindex headers (set in proxy.ts) and meta tags (below).
 */
export const metadata: Metadata = {
  title: { default: "Studio", template: "%s · Studio" },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminPathProvider base={ADMIN_BASE}>
      <ToastProvider>
        <div className="min-h-dvh bg-cream-dim/50">{children}</div>
      </ToastProvider>
    </AdminPathProvider>
  );
}
