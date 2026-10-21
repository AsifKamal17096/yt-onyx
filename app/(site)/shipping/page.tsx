import type { Metadata } from "next";
import { Box, Clock, Globe2, PackageCheck, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Shipping & packaging",
  description:
    "How YT Onyx crates and ships stone worldwide: packing method, lead times, freight options, customs paperwork and what to do if a piece arrives damaged.",
  alternates: { canonical: "/shipping" },
};

const SHIPPING_MESSAGE =
  "Hello YT Onyx! Could you quote shipping to my country?\n\nCountry: \nCity: \nPieces I'm interested in: ";

const PACKING = [
  {
    Icon: Box,
    title: "Wrapped, then boxed, then crated",
    body: "Each piece is wrapped in foam and bubble, seated in a fitted box with corner protection, and — for anything heavy or fragile — enclosed in a timber crate built in our own workshop.",
  },
  {
    Icon: PackageCheck,
    title: "Photographed before closing",
    body: "We photograph your order packed and send the images before the crate is sealed, so you know exactly what left the workshop and in what condition.",
  },
  {
    Icon: ShieldAlert,
    title: "Insured on request",
    body: "Transit insurance can be added to any shipment. For high-value or architectural orders we recommend it, and we will quote it alongside the freight.",
  },
];

const METHODS = [
  {
    name: "Air freight / courier",
    detail: "Small and medium pieces, 5–12 days door to door",
    body: "Best for lamps, tableware, decor and gifts. Tracked the whole way, with the tracking number sent to you on WhatsApp the day it leaves.",
  },
  {
    name: "Sea freight",
    detail: "Furniture, slabs and bulk orders, 25–45 days port to port",
    body: "The economical route for heavy stone. We quote LCL for single large pieces and FCL for wholesale volumes, including crating and export documentation.",
  },
];

const FAQ_POINTS = [
  {
    question: "How is shipping priced?",
    answer:
      "Per destination and per weight. Stone is dense, so a small piece can cost more to send than it looks. We calculate the exact freight for your address before you commit to anything, and send it to you on WhatsApp.",
  },
  {
    question: "Who pays duties and taxes?",
    answer:
      "Import duties, VAT or GST are set by your country and are payable by you on arrival. We declare goods honestly at their real value and provide a commercial invoice, packing list and certificate of origin where required.",
  },
  {
    question: "How long until my order is dispatched?",
    answer:
      "In-stock pieces are usually crated and collected within three to five working days. Made-to-order pieces follow the lead time quoted for that item — typically four to five weeks for basins and furniture, eight to ten for architectural commissions.",
  },
  {
    question: "What if something arrives damaged?",
    answer:
      "Photograph the crate before opening it fully, then the piece, and send both to us on WhatsApp within 48 hours of delivery. Breakages are rare, but when they happen we replace or remake the piece — that is why we photograph everything before dispatch.",
  },
];

export default async function ShippingPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    SHIPPING_MESSAGE,
  );

  return (
    <>
      <PageHeader
        eyebrow="Worldwide delivery"
        title="Stone that arrives the way it left"
        intro="We have been crating and exporting fragile stone since 1992. Here is exactly how your order is packed, shipped and documented."
        breadcrumb="Shipping & packaging"
      />

      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Packaging"
          title="Three layers between your piece and the road"
        />
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {PACKING.map(({ Icon, title, body }) => (
            <div key={title} className="border-t border-line pt-6">
              <Icon className="h-6 w-6 text-gold-deep" strokeWidth={1.3} />
              <h3 className="mt-4 font-serif text-xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-cream-dim/40 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Freight options"
            title="Two ways stone travels"
            description="Which one suits you depends on weight, urgency and budget. We quote both when it is a close call."
          />
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {METHODS.map((method) => (
              <div key={method.name} className="border border-line bg-cream p-8">
                <Globe2 className="h-6 w-6 text-gold-deep" strokeWidth={1.3} />
                <h3 className="mt-5 font-serif text-2xl">{method.name}</h3>
                <p className="mt-2 flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted">
                  <Clock className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {method.detail}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted">
                  {method.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <SectionHeading
            eyebrow="Good to know"
            title="The details people usually ask about"
          />
          <dl className="space-y-8">
            {FAQ_POINTS.map((point) => (
              <div key={point.question} className="border-t border-line pt-6">
                <dt className="font-serif text-xl">{point.question}</dt>
                <dd className="mt-3 text-sm leading-relaxed text-muted">
                  {point.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="bg-ink py-16 text-cream sm:py-20">
        <div className="container-page max-w-2xl text-center">
          <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
            Want the freight cost before you decide?
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-cream/65">
            Send us your country and the pieces you are considering. We will come
            back with the exact shipping cost and transit time — no obligation,
            no account needed.
          </p>
          <Button
            href={whatsappHref}
            variant="whatsapp"
            size="lg"
            external={whatsappHref.startsWith("http")}
            className="mt-8"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Get a shipping quote
          </Button>
        </div>
      </section>
    </>
  );
}
