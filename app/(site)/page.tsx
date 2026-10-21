import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Gem,
  Globe2,
  MessageCircle,
  PackageCheck,
  PencilRuler,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/Button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { GENERAL_ENQUIRY_MESSAGE } from "@/components/site/Header";
import { BRAND } from "@/lib/brand";
import { getCategoriesWithCounts, getFeaturedProducts } from "@/lib/catalog";
import { organizationSchema } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import { getPublishedTestimonials } from "@/lib/testimonials";
import { mediaUrl } from "@/lib/storage";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  // `absolute` stops the root layout's "%s | YT Onyx" template doubling the name.
  title: { absolute: `${BRAND.name} — ${BRAND.tagline}` },
  description: BRAND.description,
  alternates: { canonical: "/" },
};

const REASONS = [
  {
    Icon: Gem,
    title: "Carved by hand",
    body: "Every piece is cut, turned and polished by the same craftsmen who have been with the workshop for decades. No moulds, no mass production.",
  },
  {
    Icon: Globe2,
    title: "Shipped worldwide",
    body: "We have sent stone to more than forty countries. Tell us where you are and we quote the freight before you commit to anything.",
  },
  {
    Icon: PencilRuler,
    title: "Custom & bulk orders",
    body: "Send a drawing, a photograph or a rough sketch. We quote to your measurements and produce anything from one piece to a container load.",
  },
  {
    Icon: ShieldCheck,
    title: "Export-grade packing",
    body: "Foam, corner protection and timber crates built in-house. Stone is fragile, and our packing is the reason it arrives in one piece.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Browse the collection",
    body: "Every piece shows its price, stone, dimensions and weight. Add the ones you like to your inquiry list as you go.",
  },
  {
    number: "02",
    title: "Message us on WhatsApp",
    body: "One tap sends us your selection. We confirm availability, calculate shipping to your country and answer anything you want to ask.",
  },
  {
    number: "03",
    title: "We confirm and ship",
    body: "Once the details are agreed, we crate your order, send photographs before dispatch and share the tracking number.",
  },
];

export default async function HomePage() {
  const [settings, featured, categories, testimonials] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts(4),
    getCategoriesWithCounts(),
    getPublishedTestimonials(3),
  ]);

  const whatsappHref = buildWhatsAppUrl(
    settings.whatsappNumber,
    GENERAL_ENQUIRY_MESSAGE,
  );
  const heroImage = mediaUrl(settings.heroImageKey);

  return (
    <>
      <JsonLd data={organizationSchema(settings)} />

      {/* ---------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden bg-ink text-cream">
        {heroImage ? (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-10 object-cover opacity-55"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(130%_90%_at_18%_15%,rgba(184,147,90,0.26),transparent_58%),radial-gradient(90%_70%_at_82%_80%,rgba(184,147,90,0.14),transparent_60%)]"
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30"
        />

        <div className="container-page flex min-h-[78vh] max-w-5xl flex-col justify-center py-24 text-center sm:py-32">
          <p className="eyebrow mx-auto text-gold animate-fade-in">
            Est. {BRAND.established} · Handcrafted onyx & marble
          </p>
          <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl animate-fade-up">
            {settings.heroHeadline}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-cream/70 sm:text-lg">
            {settings.heroSubtext}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/shop" variant="gold" size="lg" className="w-full sm:w-auto">
              Explore Collection
            </Button>
            <Button
              href={whatsappHref}
              variant="outline"
              size="lg"
              external={whatsappHref.startsWith("http")}
              className="w-full border-cream/25 text-cream hover:border-cream hover:bg-cream hover:text-ink sm:w-auto"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat on WhatsApp
            </Button>
          </div>

          {/* How the house sells, said as an invitation rather than a caveat. */}
          <p className="mx-auto mt-9 max-w-md text-[0.68rem] uppercase leading-[1.9] tracking-[0.22em] text-cream/55">
            Every order begins with a conversation, not a checkout
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- categories */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading
          eyebrow="Collections"
          title="Eight ways stone enters a home"
          description="From a single candle holder to a bookmatched feature wall, every category starts from the same raw block."
          href="/shop"
          linkLabel="Shop all"
        />

        <div className="mt-12 grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
          {categories.map((category) => {
            const image = mediaUrl(category.imageKey);
            return (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden bg-cream p-5 transition-colors duration-500 sm:aspect-square lg:aspect-[4/5]"
              >
                {image ? (
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="absolute inset-0 object-cover transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-105"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-cream-dim),var(--color-cream-deep))] transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-105"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent opacity-85 transition-opacity duration-500 group-hover:opacity-95"
                />
                <div className="relative">
                  <h3 className="font-serif text-xl text-cream sm:text-2xl">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-[0.66rem] uppercase tracking-[0.18em] text-cream/60">
                    {category.productCount}{" "}
                    {category.productCount === 1 ? "piece" : "pieces"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------ featured */}
      {featured.length > 0 ? (
        <section className="border-y border-line bg-cream-dim/40 py-20 sm:py-24">
          <div className="container-page">
            <SectionHeading
              eyebrow="Selected pieces"
              title="This month from the workshop"
              description="A rotating selection of what is finished, polished and ready to crate."
              href="/shop?sort=featured"
              linkLabel="See more"
            />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index < 2}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------------------ heritage */}
      <section className="container-page grid items-center gap-12 py-20 sm:py-24 lg:grid-cols-2 lg:gap-20">
        <div className="relative aspect-[5/6] overflow-hidden bg-ink">
          <Image
            src={BRAND.logoMark}
            alt=""
            width={520}
            height={520}
            className="absolute left-1/2 top-1/2 w-3/5 -translate-x-1/2 -translate-y-1/2 opacity-90"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(90%_70%_at_30%_20%,rgba(184,147,90,0.22),transparent_60%)]"
          />
        </div>

        <div>
          <SectionHeading
            eyebrow="Our heritage"
            title="A workshop that has not changed its mind since 1992"
          />
          <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted">
            <p>
              YT Onyx began with one lathe, a single quarry contact and a
              conviction that stone should be worked slowly. More than three
              decades later the tools have improved, the hands have not changed
              hands, and the conviction is intact.
            </p>
            <p>
              We buy blocks directly, which is why we can tell you which hillside
              a piece came from and why the banding in your lamp looks nothing
              like the one in the photograph. Each block is cut, shaped, sanded
              through seven grits and finished by a craftsman who signs off on it
              personally.
            </p>
            <p>
              Nothing here is drop-shipped and nothing is bought in. If it carries
              our name, it was made in our workshop.
            </p>
          </div>
          <Button href="/about" variant="outline" className="mt-8">
            Read our story
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </section>

      {/* --------------------------------------------------------- why choose */}
      <section className="bg-ink py-20 text-cream sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why YT Onyx"
            title="What you get when you buy direct from the workshop"
            tone="dark"
            align="center"
          />
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map(({ Icon, title, body }) => (
              <div key={title} className="text-center sm:text-left">
                <Icon className="mx-auto h-7 w-7 text-gold sm:mx-0" strokeWidth={1.2} />
                <h3 className="mt-5 font-serif text-xl text-cream">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cream/60">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ ordering */}
      <section className="container-page py-20 sm:py-24">
        <SectionHeading
          eyebrow="How ordering works"
          title="Three steps, no checkout, no card details"
          description="We sell the way a workshop has always sold: you tell us what you want, we tell you what it costs to get it to you."
          align="center"
        />

        <ol className="mt-14 grid gap-10 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.number} className="relative border-t border-line pt-6">
              <span className="font-serif text-4xl text-gold/70">
                {step.number}
              </span>
              <h3 className="mt-3 font-serif text-xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button href="/shop" size="lg">
            Start browsing
          </Button>
          <Button
            href={whatsappHref}
            variant="whatsapp"
            size="lg"
            external={whatsappHref.startsWith("http")}
          >
            <WhatsAppIcon className="h-4 w-4" />
            Ask a question first
          </Button>
        </div>
      </section>

      {/* -------------------------------------------------------- testimonials */}
      {/* Managed from the admin panel; the section hides itself when empty. */}
      {testimonials.length > 0 ? (
      <section className="border-y border-line bg-cream-dim/40 py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="In their words"
            title="Stone travels further than we do"
            align="center"
          />
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <figure
                key={testimonial.id}
                className="flex h-full flex-col border border-line bg-cream p-7"
              >
                <span aria-hidden className="font-serif text-4xl text-gold/60">
                  “
                </span>
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-ink/80">
                  {testimonial.quote}
                </blockquote>
                <figcaption className="mt-6 border-t border-line pt-4 text-[0.66rem] uppercase tracking-[0.18em] text-muted">
                  {testimonial.name} · {testimonial.location}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      ) : null}

      {/* ----------------------------------------------------------- final CTA */}
      <section className="bg-ink py-20 text-cream sm:py-28">
        <div className="container-page max-w-3xl text-center">
          <PackageCheck className="mx-auto h-8 w-8 text-gold" strokeWidth={1.2} />
          <h2 className="mt-6 font-serif text-3xl leading-tight sm:text-5xl">
            Tell us what you are looking for
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream/65">
            Send a photograph, a sketch or just a room measurement. We will tell
            you what is possible, what it costs and how long it takes — usually
            the same day.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              href={whatsappHref}
              variant="whatsapp"
              size="lg"
              external={whatsappHref.startsWith("http")}
              className="w-full sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.6} />
              Message us on WhatsApp
            </Button>
            <Button
              href="/custom-orders"
              variant="outline"
              size="lg"
              className="w-full border-cream/25 text-cream hover:border-cream hover:bg-cream hover:text-ink sm:w-auto"
            >
              Custom & bulk orders
            </Button>
          </div>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.18em] text-cream/40">
            <Truck className="h-4 w-4" strokeWidth={1.4} />
            Shipping quoted per country before you order
          </p>
        </div>
      </section>
    </>
  );
}
