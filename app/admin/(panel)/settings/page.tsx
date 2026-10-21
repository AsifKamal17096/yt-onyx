import type { Metadata } from "next";
import { clearSettingsImageAction } from "@/app/admin/_actions/settings";
import { AdminPage } from "@/components/admin/PageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { SingleImageUpload } from "@/components/admin/SingleImageUpload";
import { requireAdminPage } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { csrfToken } from "@/lib/csrf";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { mediaUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Site settings" };

export default async function SettingsPage() {
  await requireAdminPage();

  const [csrf, settings] = await Promise.all([
    csrfToken(),
    prisma.siteSettings.findUnique({ where: { id: 1 } }),
  ]);

  return (
    <AdminPage
      title="Site settings"
      description="Everything here is live on the website the moment you save it."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <SettingsForm
          csrf={csrf}
          values={{
            whatsappNumber: settings?.whatsappNumber ?? "",
            whatsappTemplate:
              settings?.whatsappTemplate ?? DEFAULT_SETTINGS.whatsappTemplate,
            heroHeadline: settings?.heroHeadline ?? DEFAULT_SETTINGS.heroHeadline,
            heroSubtext: settings?.heroSubtext ?? DEFAULT_SETTINGS.heroSubtext,
            announcement: settings?.announcement ?? "",
            contactEmail: settings?.contactEmail ?? "",
            contactPhone: settings?.contactPhone ?? "",
            addressLine: settings?.addressLine ?? "",
            mapEmbedUrl: settings?.mapEmbedUrl ?? "",
            instagramUrl: settings?.instagramUrl ?? "",
            facebookUrl: settings?.facebookUrl ?? "",
            pinterestUrl: settings?.pinterestUrl ?? "",
            tiktokUrl: settings?.tiktokUrl ?? "",
          }}
        />

        <aside className="grid h-fit gap-6">
          <div className="border border-line bg-white p-5">
            <SingleImageUpload
              target="hero"
              currentUrl={mediaUrl(settings?.heroImageKey)}
              csrf={csrf}
              label="Hero image"
              hint="Optional. Sits behind the headline on the home page, darkened for legibility. Without it, a stone-toned gradient is used."
              onClear={clearSettingsImageAction}
              clearField="heroImageKey"
            />
          </div>

          <div className="border border-line bg-white p-5">
            <SingleImageUpload
              target="logo"
              currentUrl={mediaUrl(settings?.logoKey) ?? BRAND.logo}
              csrf={csrf}
              label="Logo"
              hint="Replaces the bundled logo in the header, footer and link previews. Square images work best."
              onClear={clearSettingsImageAction}
              clearField="logoKey"
              aspect="aspect-square"
            />
          </div>
        </aside>
      </div>
    </AdminPage>
  );
}
