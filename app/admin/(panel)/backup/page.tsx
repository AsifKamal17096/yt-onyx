import type { Metadata } from "next";
import { Download, HardDrive } from "lucide-react";
import { AdminPage } from "@/components/admin/PageShell";
import { requireAdminPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { usingBlobStorage } from "@/lib/storage";

export const metadata: Metadata = { title: "Backup" };

export default async function BackupPage() {
  await requireAdminPage();

  const [products, images, categories, inquiries] = await Promise.all([
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.category.count(),
    prisma.inquiry.count(),
  ]);

  return (
    <AdminPage
      title="Backup"
      description="One zip with everything that cannot be rebuilt from the code: the database and every uploaded photograph."
    >
      <div className="max-w-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-4">
          <HardDrive className="mt-1 h-6 w-6 shrink-0 text-gold-deep" strokeWidth={1.4} />
          <div>
            <h2 className="font-serif text-xl">What is included</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted">
              <li>
                {products} products and {images} photographs
                {usingBlobStorage ? " (listed as direct links)" : ""}
              </li>
              <li>{categories} categories, plus stone types, colours and finishes</li>
              <li>{inquiries} inquiry records</li>
              <li>Your site settings, including the WhatsApp number and template</li>
            </ul>
          </div>
        </div>

        <a
          href="/api/admin/backup"
          className="mt-7 inline-flex h-11 items-center gap-2.5 rounded-xs bg-ink px-6 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-cream transition-colors hover:bg-ink-soft"
        >
          <Download className="h-4 w-4" strokeWidth={1.6} />
          Download backup
        </a>

        <p className="mt-5 text-xs leading-relaxed text-muted">
          Large catalogues take a few seconds to compress — the download starts
          on its own. Keep a copy somewhere other than the server itself, and
          take one before any big change.
        </p>
      </div>

      <div className="mt-6 max-w-2xl border border-line bg-white p-6">
        <h2 className="font-serif text-xl">Restoring</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Stop the application on the server.</li>
          <li>
            Recreate the schema with{" "}
            <code className="text-ink">prisma migrate deploy</code>.
          </li>
          <li>
            Import <code className="text-ink">content.json</code> back into the
            database.
          </li>
          <li>
            {usingBlobStorage
              ? "Images are already safe in blob storage; the URL list is only there if you want local copies."
              : "Put the uploads folder back where UPLOADS_DIR points."}
          </li>
        </ol>
      </div>
    </AdminPage>
  );
}
