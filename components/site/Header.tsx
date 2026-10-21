import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { InquiryDrawer } from "@/components/inquiry/InquiryDrawer";
import { MobileNav, NavLinks, NavLinksFallback } from "@/components/site/Nav";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { BRAND, SITE_URL } from "@/lib/brand";
import { getSiteSettings } from "@/lib/settings";
import { mediaUrl } from "@/lib/storage";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const GENERAL_ENQUIRY_MESSAGE =
  "Hello YT Onyx! I'd like to ask about your onyx and marble collection.";

/**
 * Site header: announcement bar, logo, navigation and the WhatsApp call to
 * action. The WhatsApp number comes from site settings, so it can be changed
 * from the admin panel without a deploy.
 */
export async function Header() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    GENERAL_ENQUIRY_MESSAGE,
  );
  // An uploaded logo replaces the bundled one without a code change.
  const logo = mediaUrl(settings.logoKey) ?? BRAND.logo;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur-sm">
      {settings.announcement ? (
        <div className="bg-ink px-4 py-2 text-center">
          <p className="mx-auto max-w-4xl text-[0.68rem] uppercase tracking-[0.18em] text-cream/80">
            {settings.announcement}
          </p>
        </div>
      ) : null}

      <div className="container-page flex h-18 items-center justify-between gap-4">
        <div className="flex items-center gap-2 lg:hidden">
          <MobileNav>
            <Button
              href={whatsappHref}
              variant="whatsapp"
              fullWidth
              external={whatsappHref.startsWith("http")}
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat on WhatsApp
            </Button>
          </MobileNav>
        </div>

        <Link
          href="/"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <Image
            src={logo}
            alt=""
            width={96}
            height={96}
            priority
            className="h-11 w-11 object-contain"
          />
          <span className="sr-only">{BRAND.name} — home</span>
          <span
            aria-hidden="true"
            className="hidden font-serif text-xl tracking-[0.3em] text-ink sm:block"
          >
            YT ONYX
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <Suspense fallback={<NavLinksFallback />}>
            <NavLinks />
          </Suspense>
        </nav>

        <div className="flex items-center gap-1 sm:gap-3">
          <InquiryDrawer
            whatsappNumber={settings.whatsappNumber}
            siteUrl={SITE_URL}
          />
          <Button
            href={whatsappHref}
            variant="whatsapp"
            size="sm"
            external={whatsappHref.startsWith("http")}
            className="hidden sm:inline-flex"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span className="hidden md:inline">WhatsApp</span>
            <span className="md:hidden">Chat</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
