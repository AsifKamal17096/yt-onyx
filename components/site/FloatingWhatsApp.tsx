import { WhatsAppLink } from "@/components/site/WhatsAppLink";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const MESSAGE =
  "Hello YT Onyx! I'm browsing your website and would like some help.";

/**
 * Persistent WhatsApp button, present on every public page.
 * Falls back to the Contact page when no number has been saved yet.
 */
export async function FloatingWhatsApp() {
  const settings = await getSiteSettings();
  const href = buildWhatsAppUrl(settings.whatsappNumber, MESSAGE);

  return (
    <WhatsAppLink
      href={href}
      source="FLOATING"
      ariaLabel="Chat with YT Onyx on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f7a55] text-white shadow-[0_12px_28px_-10px_rgba(10,10,10,0.7)] transition-all duration-300 ease-[var(--ease-brand)] hover:scale-105 hover:bg-[#17603f] sm:bottom-7 sm:right-7 print:hidden"
    >
      <WhatsAppIcon className="h-7 w-7" />
      <span className="pointer-events-none absolute right-16 hidden whitespace-nowrap bg-ink px-3 py-2 text-[0.66rem] uppercase tracking-[0.16em] text-cream opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block">
        Chat on WhatsApp
      </span>
    </WhatsAppLink>
  );
}
