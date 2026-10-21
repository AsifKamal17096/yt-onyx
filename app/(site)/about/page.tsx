import Image from "next/image";
import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageHeader";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { GENERAL_ENQUIRY_MESSAGE } from "@/components/site/Header";
import { BRAND } from "@/lib/brand";
import { getSiteSettings } from "@/lib/settings";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "YT Onyx has been cutting, turning and polishing onyx and marble by hand since 1992. Meet the workshop behind the pieces.",
  alternates: { canonical: "/about" },
};

const MILESTONES = [
  {
    year: "1992",
    title: "One lathe, one quarry contact",
    body: "The workshop opens with a single lathe and an agreement to buy blocks directly from a quarry in the hills. The principle — buy the block, know the stone — has not changed since.",
  },
  {
    year: "2001",
    title: "First export crate",
    body: "A set of lamps leaves for a buyer in Europe, packed in a crate built on the workshop floor. We still build our own crates for the same reason: nobody else packs stone the way it needs to be packed.",
  },
  {
    year: "2012",
    title: "Architectural work",
    body: "Studios begin asking for bookmatched slabs and cut-to-size surfaces. Production grows to handle project volumes without changing how a single piece is finished.",
  },
  {
    year: "Today",
    title: "Forty countries, same hands",
    body: "Most of the craftsmen who joined in the first decade are still at the bench, and most of our orders still begin as a message rather than a purchase order.",
  },
];

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    GENERAL_ENQUIRY_MESSAGE,
  );

  return (
    <>
      <PageHeader
        eyebrow={`Est. ${BRAND.established}`}
        title="Three decades at the same bench"
        intro="We are a workshop, not a showroom. Everything that carries our name was cut, shaped and polished here by people whose names we know."
        breadcrumb="Our story"
      />

      <section className="container-page grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
        <div className="space-y-5 text-sm leading-relaxed text-muted">
          <p className="font-serif text-2xl leading-snug text-ink">
            Onyx does not forgive haste. Cut it too fast and it chips; polish it
            too hard and the translucency dulls. Everything about the way we work
            follows from that.
          </p>
          <p>
            YT Onyx began in 1992 with one lathe and a conviction that stone
            deserved to be worked slowly. We buy blocks direct from the quarries
            rather than through traders, which is why we can tell you which
            hillside a piece came from, and why the banding in the lamp you
            receive will not look like the one in the photograph. That is not a
            defect. It is the stone.
          </p>
          <p>
            Each block is sawn, cored or carved depending on what it will become,
            then shaped, sanded through seven grits and polished by hand. A
            serving board takes a day. A basin takes a week. A reception counter
            can take two months. Nothing is rushed to meet a sales target,
            because there are no sales targets — only orders from people who
            messaged us and asked.
          </p>
          <p>
            We have shipped to more than forty countries, and we still crate
            every order ourselves. Stone is heavy, fragile and expensive to send
            twice, so packing is treated as part of the craft rather than an
            afterthought.
          </p>
        </div>

        <div className="relative aspect-[4/5] overflow-hidden bg-ink">
          <Image
            src={BRAND.logoMark}
            alt=""
            width={520}
            height={520}
            className="absolute left-1/2 top-1/2 w-2/3 -translate-x-1/2 -translate-y-1/2"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(85%_65%_at_25%_20%,rgba(184,147,90,0.25),transparent_62%)]"
          />
        </div>
      </section>

      <section className="border-y border-line bg-cream-dim/40 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Milestones" title="How the workshop grew" />
          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {MILESTONES.map((milestone) => (
              <li key={milestone.year} className="border-t border-line pt-6">
                <p className="font-serif text-3xl text-gold">{milestone.year}</p>
                <h3 className="mt-3 font-serif text-xl">{milestone.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {milestone.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-page py-16 text-center sm:py-20">
        <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
          If you have a question about a stone, ask the people who cut it
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted">
          We answer messages ourselves. No call centre, no ticket number — just
          the workshop.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            href={whatsappHref}
            variant="whatsapp"
            size="lg"
            external={whatsappHref.startsWith("http")}
          >
            <WhatsAppIcon className="h-4 w-4" />
            Message the workshop
          </Button>
          <Button href="/shop" variant="outline" size="lg">
            Browse the collection
          </Button>
        </div>
      </section>
    </>
  );
}
