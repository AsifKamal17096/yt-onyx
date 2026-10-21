import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  FacebookIcon,
  InstagramIcon,
  PinterestIcon,
  TikTokIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { GENERAL_ENQUIRY_MESSAGE } from "@/components/site/Header";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl, displayWhatsAppNumber } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Message the YT Onyx workshop on WhatsApp or by email for prices, custom commissions, wholesale enquiries and shipping quotes.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    GENERAL_ENQUIRY_MESSAGE,
  );
  const whatsappNumber = displayWhatsAppNumber(settings.whatsappNumber);
  const whatsappReady = whatsappHref.startsWith("http");

  const socials = [
    { href: settings.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: settings.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: settings.pinterestUrl, label: "Pinterest", Icon: PinterestIcon },
    { href: settings.tiktokUrl, label: "TikTok", Icon: TikTokIcon },
  ].filter((social): social is typeof social & { href: string } =>
    Boolean(social.href),
  );

  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Talk to the workshop directly"
        intro="There is no contact form here on purpose. Messages reach us faster on WhatsApp, and you can send photographs of what you have in mind."
        breadcrumb="Contact"
      />

      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="font-serif text-3xl">The fastest way to reach us</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            We answer WhatsApp ourselves during workshop hours and usually within
            a few hours outside them. Send a photograph, a sketch or a question —
            all three are welcome.
          </p>

          <Button
            href={whatsappHref}
            variant="whatsapp"
            size="lg"
            external={whatsappReady}
            className="mt-7"
          >
            <WhatsAppIcon className="h-4 w-4" />
            {whatsappReady ? "Open WhatsApp" : "WhatsApp coming soon"}
          </Button>

          <dl className="mt-12 space-y-7 border-t border-line pt-8">
            {whatsappNumber ? (
              <div className="flex gap-4">
                <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
                <div>
                  <dt className="eyebrow text-muted">WhatsApp</dt>
                  <dd className="mt-1.5 text-sm text-ink">{whatsappNumber}</dd>
                </div>
              </div>
            ) : null}

            {settings.contactEmail ? (
              <div className="flex gap-4">
                <Mail
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                  strokeWidth={1.4}
                />
                <div>
                  <dt className="eyebrow text-muted">Email</dt>
                  <dd className="mt-1.5 text-sm">
                    <a
                      href={`mailto:${settings.contactEmail}`}
                      className="text-ink underline underline-offset-4 transition-colors hover:text-gold-deep"
                    >
                      {settings.contactEmail}
                    </a>
                  </dd>
                </div>
              </div>
            ) : null}

            {settings.contactPhone ? (
              <div className="flex gap-4">
                <Phone
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                  strokeWidth={1.4}
                />
                <div>
                  <dt className="eyebrow text-muted">Telephone</dt>
                  <dd className="mt-1.5 text-sm">
                    <a
                      href={`tel:${settings.contactPhone.replace(/\s+/g, "")}`}
                      className="text-ink underline underline-offset-4 transition-colors hover:text-gold-deep"
                    >
                      {settings.contactPhone}
                    </a>
                  </dd>
                </div>
              </div>
            ) : null}

            {settings.addressLine ? (
              <div className="flex gap-4">
                <MapPin
                  className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                  strokeWidth={1.4}
                />
                <div>
                  <dt className="eyebrow text-muted">Workshop</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                    {settings.addressLine}
                  </dd>
                </div>
              </div>
            ) : null}

            <div className="flex gap-4">
              <Clock
                className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep"
                strokeWidth={1.4}
              />
              <div>
                <dt className="eyebrow text-muted">Workshop hours</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-ink">
                  Monday to Saturday, 9am – 7pm (GMT+5)
                  <span className="mt-1 block text-muted">
                    Messages outside these hours are answered the next morning.
                  </span>
                </dd>
              </div>
            </div>
          </dl>

          {socials.length > 0 ? (
            <div className="mt-10 border-t border-line pt-8">
              <p className="eyebrow text-muted">Follow the work</p>
              <ul className="mt-4 flex items-center gap-5">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="text-muted transition-colors hover:text-gold-deep"
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div>
          <div className="relative aspect-[4/3] overflow-hidden border border-line bg-cream-dim">
            {settings.mapEmbedUrl ? (
              <iframe
                src={settings.mapEmbedUrl}
                title="Workshop location"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
                <MapPin className="h-7 w-7 text-muted" strokeWidth={1.2} />
                <p className="text-sm text-muted">
                  {settings.addressLine || "Workshop address coming soon"}
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-muted/70">
                  A map of the workshop will appear here shortly. Message us and
                  we will send directions.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 border border-line bg-cream-dim/40 p-7">
            <h2 className="font-serif text-2xl">Visiting the workshop</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Clients and trade buyers are welcome to visit and choose blocks in
              person. Message us first so someone is free to walk you through the
              yard — the saws are loud and the schedule moves.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
