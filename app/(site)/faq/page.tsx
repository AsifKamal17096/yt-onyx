import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { GENERAL_ENQUIRY_MESSAGE } from "@/components/site/Header";
import { faqSchema } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Ordering, payment, shipping, stone care and customs — the questions we are asked most often about buying handcrafted onyx and marble from YT Onyx.",
  alternates: { canonical: "/faq" },
};

/** Exported so the SEO pass can emit matching FAQPage JSON-LD. */
export const FAQ_SECTIONS = [
  {
    title: "Ordering",
    items: [
      {
        question: "How do I place an order?",
        answer:
          "Browse the collection, then press “Order on WhatsApp” on any product — or build an inquiry list and send everything in one message. We reply with availability, the shipping cost to your country and the total, then confirm your order.",
      },
      {
        question: "Why is there no checkout or shopping cart?",
        answer:
          "Because stone is heavy and freight differs enormously between destinations, a checkout would either overcharge you or quote you a number we cannot honour. Agreeing the price on WhatsApp means you know the real total before you commit to anything.",
      },
      {
        question: "How do I pay?",
        answer:
          "After we agree the order, we send payment details on WhatsApp — usually a bank transfer, and for smaller orders other methods on request. Nothing is charged through this website, and we never ask for card details in a chat.",
      },
      {
        question: "Can I order a piece I cannot find on the website?",
        answer:
          "Yes, and most of our work is exactly that. Send a photograph, drawing or measurement to WhatsApp and we will quote it. See the Custom & bulk orders page for how commissions run.",
      },
    ],
  },
  {
    title: "The stone",
    items: [
      {
        question: "Will my piece look like the photograph?",
        answer:
          "In shape and finish, yes. In veining, no — every block is different, and that is the point of natural stone. For pieces where the pattern matters, we photograph the actual item or block before dispatch so there are no surprises.",
      },
      {
        question: "What is the difference between onyx and marble?",
        answer:
          "Both are calcium carbonate stones, but onyx is banded and translucent, which is why it is used for backlit panels and lamps. Marble is denser and more uniform, which makes it the better choice for worktops, furniture and anything structural.",
      },
      {
        question: "Is the stone food-safe?",
        answer:
          "Our tableware is sealed with a food-safe sealer and is safe for serving. Avoid cutting directly on the surface and keep acidic foods — lemon, vinegar, wine — from sitting on the polish.",
      },
      {
        question: "How do I care for it?",
        answer:
          "Dust with a soft dry cloth and clean with warm water and pH-neutral soap. Never use vinegar, citrus, bleach or limescale remover: acid etches these stones permanently. Re-seal once a year, and every product page lists care instructions specific to that piece.",
      },
    ],
  },
  {
    title: "Shipping & delivery",
    items: [
      {
        question: "Do you ship to my country?",
        answer:
          "We have shipped to more than forty countries and can quote almost anywhere. Message us with your city and we will confirm the route, the cost and the transit time.",
      },
      {
        question: "How much does shipping cost?",
        answer:
          "It depends on weight and destination, so it is quoted per order rather than published. You will always have the exact figure before you pay anything.",
      },
      {
        question: "Will I pay customs duty?",
        answer:
          "Import duties and taxes are set by your own country and are payable on arrival. We provide the commercial invoice, packing list and certificate of origin needed to clear customs.",
      },
      {
        question: "What if my order arrives damaged?",
        answer:
          "Photograph the crate and the piece and send them to us within 48 hours. We photograph every order before it is sealed, so claims are straightforward, and we replace or remake broken pieces.",
      },
    ],
  },
  {
    title: "Trade & wholesale",
    items: [
      {
        question: "Do you offer trade pricing?",
        answer:
          "Yes, for interior studios, hotel groups, retailers and stone importers. Tell us your volumes on WhatsApp and we will send trade pricing and a production calendar.",
      },
      {
        question: "Can you match an existing installation?",
        answer:
          "Often, yes. Send photographs and measurements of what you have. If we can source a comparable block we will say so honestly — and if we cannot, we will tell you that too.",
      },
    ],
  },
];

export default async function FaqPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    GENERAL_ENQUIRY_MESSAGE,
  );

  return (
    <>
      <JsonLd data={faqSchema(FAQ_SECTIONS)} />
      <PageHeader
        eyebrow="Answers"
        title="Everything people ask before they order"
        intro="If your question is not here, message us — we answer from the workshop, usually within a few hours."
        breadcrumb="FAQ"
      />

      <div className="container-page py-16 sm:py-20">
        <div className="grid gap-14 lg:grid-cols-[260px_1fr] lg:gap-20">
          <nav aria-label="FAQ sections" className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow text-muted">On this page</p>
            <ul className="mt-5 space-y-3">
              {FAQ_SECTIONS.map((section) => (
                <li key={section.title}>
                  <a
                    href={`#${slugify(section.title)}`}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-14">
            {FAQ_SECTIONS.map((section) => (
              <section
                key={section.title}
                id={slugify(section.title)}
                className="scroll-mt-28"
              >
                <h2 className="font-serif text-3xl">{section.title}</h2>
                <div className="mt-6 divide-y divide-line border-y border-line">
                  {section.items.map((item) => (
                    <details key={item.question} className="group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left text-base text-ink transition-colors hover:text-gold-deep [&::-webkit-details-marker]:hidden">
                        {item.question}
                        <ChevronDown
                          className="h-4 w-4 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                          strokeWidth={1.5}
                        />
                      </summary>
                      <p className="pb-6 pr-10 text-sm leading-relaxed text-muted">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="mt-16 border border-line bg-cream-dim/40 p-8 text-center sm:p-12">
          <h2 className="font-serif text-2xl sm:text-3xl">
            Still deciding? Ask us anything
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted">
            Questions about a stone, a size, a deadline or a shipping route — we
            would rather answer twenty questions than send you the wrong piece.
          </p>
          <Button
            href={whatsappHref}
            variant="whatsapp"
            size="lg"
            external={whatsappHref.startsWith("http")}
            className="mt-7"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Message us on WhatsApp
          </Button>
        </div>
      </div>
    </>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
