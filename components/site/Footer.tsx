import Image from "next/image";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { Mail, MapPin } from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  PinterestIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { getCategoriesWithCounts } from "@/lib/catalog";
import { getSiteSettings } from "@/lib/settings";
import { mediaUrl } from "@/lib/storage";
import { buildWhatsAppUrl, displayWhatsAppNumber } from "@/lib/whatsapp";
import { GENERAL_ENQUIRY_MESSAGE } from "@/components/site/Header";

const QUICK_LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/custom-orders", label: "Custom & bulk orders" },
  { href: "/about", label: "Our story" },
  { href: "/shipping", label: "Shipping & packaging" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export async function Footer() {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategoriesWithCounts(),
  ]);

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    GENERAL_ENQUIRY_MESSAGE,
  );
  const whatsappNumber = displayWhatsAppNumber(settings.whatsappNumber);
  const logo = mediaUrl(settings.logoKey) ?? BRAND.logo;

  const socials = [
    { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: settings.pinterestUrl, label: "Pinterest", Icon: PinterestIcon },
    { href: settings.tiktokUrl, label: "TikTok", Icon: TikTokIcon },
  ].filter((social): social is typeof social & { href: string } =>
    Boolean(social.href),
  );

  return (
    <footer className="mt-auto bg-ink text-cream">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src={logo}
            alt={`${BRAND.name} logo`}
            width={120}
            height={120}
            className="h-20 w-20 object-contain"
          />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-cream/60">
            {BRAND.description}
          </p>
          {socials.length > 0 ? (
            <ul className="mt-6 flex items-center gap-4">
              {socials.map(({ href, label, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="text-cream/60 transition-colors hover:text-gold"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-labelledby="footer-links">
          <h2 id="footer-links" className="eyebrow text-gold">
            Explore
          </h2>
          <ul className="mt-5 space-y-3">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-cream/70 transition-colors hover:text-cream"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-categories">
          <h2 id="footer-categories" className="eyebrow text-gold">
            Collections
          </h2>
          <ul className="mt-5 space-y-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-sm text-cream/70 transition-colors hover:text-cream"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow text-gold">Get in touch</h2>
          <ul className="mt-5 space-y-4 text-sm text-cream/70">
            <li>
              <a
                href={whatsappHref}
                target={whatsappHref.startsWith("http") ? "_blank" : undefined}
                rel={
                  whatsappHref.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                className="inline-flex items-center gap-2.5 transition-colors hover:text-cream"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-gold" />
                {whatsappNumber ?? "Message us on WhatsApp"}
              </a>
            </li>
            {settings.contactEmail ? (
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="inline-flex items-center gap-2.5 transition-colors hover:text-cream"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
                  {settings.contactEmail}
                </a>
              </li>
            ) : null}
            {settings.addressLine ? (
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                  strokeWidth={1.5}
                />
                <span>{settings.addressLine}</span>
              </li>
            ) : null}
          </ul>

          <p className="mt-6 text-xs leading-relaxed text-cream/40">
            Orders are placed and confirmed over WhatsApp. Shipping is quoted
            per country before you pay anything.
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-cream/40 sm:flex-row">
          <p>
            © <CopyrightYear /> {BRAND.name}. Hand-made since{" "}
            {BRAND.established}.
          </p>
          <p>Carved, polished and packed in our own workshop.</p>
        </div>
      </div>
    </footer>
  );
}

/**
 * Reading the clock during a prerender has to be explicit under Cache
 * Components. Caching it for a day keeps the footer static and still rolls
 * over on New Year's Day.
 */
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
