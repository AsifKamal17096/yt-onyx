import type { Metadata } from "next";
import {
  Boxes,
  FileImage,
  Hammer,
  Ruler,
  Ship,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/site/PageHeader";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Custom & bulk orders",
  description:
    "Commission onyx and marble to your own drawings, or order wholesale volumes for hotels, studios and retailers. Quotes and progress photos over WhatsApp.",
  alternates: { canonical: "/custom-orders" },
};

const CUSTOM_MESSAGE =
  "Hello YT Onyx! I'd like a quote for a custom or bulk order.\n\nPiece: \nSize / drawing: \nStone preference: \nQuantity: \nDelivery country: ";

const PROCESS = [
  {
    Icon: FileImage,
    title: "Send what you have",
    body: "A photograph, a sketch on paper, a CAD drawing or just room measurements. Anything that shows what you are imagining is enough to start.",
  },
  {
    Icon: Ruler,
    title: "We confirm what is possible",
    body: "Stone has limits — spans, thicknesses, the size of block available. We will tell you honestly what works, what does not, and what we would do instead.",
  },
  {
    Icon: Sparkles,
    title: "Block selection",
    body: "For anything where veining matters, we photograph the actual blocks or slabs and let you choose before a single cut is made.",
  },
  {
    Icon: Hammer,
    title: "Production with updates",
    body: "You receive progress photographs at the main stages. Lead times run from two weeks for small runs to ten weeks for architectural work.",
  },
  {
    Icon: Boxes,
    title: "Packing and inspection",
    body: "Everything is foam-wrapped, corner-protected and crated in-house, then photographed again before the crate is closed.",
  },
  {
    Icon: Ship,
    title: "Freight to your door",
    body: "Air or sea freight quoted per destination, with all export documentation prepared. Large commissions ship in numbered sections with an installation drawing.",
  },
];

const CAPABILITIES = [
  "Hotel and restaurant counters, bar fronts and reception desks",
  "Bespoke basins, bath surrounds and vanity tops",
  "Backlit onyx feature walls and bookmatched slab pairs",
  "Branded corporate gifts, awards and engraved keepsakes",
  "Wholesale volumes of tableware, decor and lighting for retailers",
  "Replacement or matching pieces for an existing installation",
];

export default async function CustomOrdersPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppUrl(settings.whatsappNumber, CUSTOM_MESSAGE);
  const external = whatsappHref.startsWith("http");

  return (
    <>
      <PageHeader
        eyebrow="Commissions & wholesale"
        title="Made to your measurements, in the quantity you need"
        intro="Most of what leaves the workshop was never listed on this website. Send us a drawing, a photograph or a specification and we will quote it."
        breadcrumb="Custom & bulk"
      />

      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="How a commission works"
          title="Six steps from an idea to a crate"
        />
        <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {PROCESS.map(({ Icon, title, body }, index) => (
            <li key={title} className="border-t border-line pt-6">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-gold-deep" strokeWidth={1.3} />
                <span className="text-[0.66rem] uppercase tracking-[0.18em] text-muted">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-cream-dim/40 py-16 sm:py-20">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="What we take on"
              title="From one engraved gift to a container of tableware"
            />
            <ul className="mt-8 space-y-3">
              {CAPABILITIES.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 border-b border-line pb-3 text-sm text-muted"
                >
                  <span aria-hidden className="text-gold">
                    —
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-ink p-8 text-cream sm:p-10">
            <h2 className="font-serif text-2xl leading-snug">
              What to include in your first message
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-cream/65">
              The more of this you can tell us, the faster the quote comes back —
              usually the same working day.
            </p>
            <ul className="mt-7 space-y-4 text-sm text-cream/75">
              <li>
                <span className="text-gold">01.</span> What the piece is, and a
                photograph or sketch if you have one
              </li>
              <li>
                <span className="text-gold">02.</span> Dimensions, or the space it
                has to fit
              </li>
              <li>
                <span className="text-gold">03.</span> Stone and finish you have
                in mind, if any
              </li>
              <li>
                <span className="text-gold">04.</span> Quantity
              </li>
              <li>
                <span className="text-gold">05.</span> Delivery country and any
                deadline
              </li>
            </ul>

            <Button
              href={whatsappHref}
              variant="whatsapp"
              size="lg"
              fullWidth
              external={external}
              className="mt-9"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Start a custom order
            </Button>
            <p className="mt-4 text-xs leading-relaxed text-cream/40">
              No deposit is taken until the drawing, price and lead time are
              agreed in writing.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-16 text-center sm:py-20">
        <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
          Trade, wholesale and repeat orders
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted">
          We work with interior studios, hotel groups, gift retailers and stone
          importers. Tell us your volumes and we will send trade pricing, sample
          options and a production calendar.
        </p>
        <Button
          href={whatsappHref}
          variant="primary"
          size="lg"
          external={external}
          className="mt-8"
        >
          Request trade pricing
        </Button>
      </section>
    </>
  );
}
