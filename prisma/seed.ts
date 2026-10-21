import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { createDemoImage, type StonePalette } from "./demo-images";

/**
 * Seeds the catalogue scaffolding (categories, stone types, colours, finishes,
 * site settings) and eight demo products.
 *
 * Safe to run more than once: everything is upserted by slug, and demo images
 * are only generated for products that have none yet. Every demo product is
 * flagged `isDemo`, so the admin panel can show them as demo data and remove
 * them in one action once real photography is in place.
 */

const CATEGORIES = [
  {
    slug: "home-decor",
    name: "Home Decor",
    description:
      "Sculptural pieces for the rooms you live in: candle holders, bowls, spheres and vases turned from solid blocks of onyx and marble.",
    seoTitle: "Onyx & Marble Home Decor | YT Onyx",
    seoDescription:
      "Hand-carved onyx and marble decor — candle holders, bowls, vases and sculptural objects, made in our workshop and shipped worldwide.",
  },
  {
    slug: "tableware-kitchen",
    name: "Tableware & Kitchen",
    description:
      "Serving boards, platters, mortars and coasters cut from food-safe stone and finished to a silk polish that keeps its edge for decades.",
    seoTitle: "Marble & Onyx Tableware | YT Onyx",
    seoDescription:
      "Serving boards, platters, mortar and pestle sets and coasters in hand-finished marble and onyx. Worldwide shipping from our workshop.",
  },
  {
    slug: "furniture",
    name: "Furniture",
    description:
      "Side tables, pedestals and consoles built around a single slab, balanced by hand so the stone does the talking.",
    seoTitle: "Onyx & Marble Furniture | YT Onyx",
    seoDescription:
      "Side tables, consoles and pedestals in solid onyx and marble, made to order in our workshop and crated for export.",
  },
  {
    slug: "lighting",
    name: "Lighting",
    description:
      "Onyx is translucent. Lit from within, every lamp shows the grain the quarry left behind — no two shades are alike.",
    seoTitle: "Onyx Lamps & Lighting | YT Onyx",
    seoDescription:
      "Backlit onyx table lamps, pendants and sconces. Each piece is hand-turned, so the veining and glow are unique.",
  },
  {
    slug: "bathroom",
    name: "Bathroom",
    description:
      "Vessel basins, soap dishes and bath accessories carved from blocks chosen for density, then sealed for daily use.",
    seoTitle: "Marble & Onyx Bathroom Pieces | YT Onyx",
    seoDescription:
      "Hand-carved stone vessel basins, soap dishes and bath accessories in onyx and marble, sealed and ready for daily use.",
  },
  {
    slug: "slabs-tiles-surfaces",
    name: "Slabs, Tiles & Surfaces",
    description:
      "Bookmatched slabs, cut-to-size tiles and counter surfaces for architects and interior studios, supplied with quarry-matched batches.",
    seoTitle: "Onyx & Marble Slabs, Tiles & Surfaces | YT Onyx",
    seoDescription:
      "Bookmatched onyx slabs, marble tiles and cut-to-size surfaces for interiors projects. Quarry-matched batches, export crating included.",
  },
  {
    slug: "gifts-artifacts",
    name: "Gifts & Artifacts",
    description:
      "Chess sets, boxes, bookends and keepsakes — the pieces people buy for an occasion and keep for a generation.",
    seoTitle: "Stone Gifts & Artifacts | YT Onyx",
    seoDescription:
      "Onyx chess sets, keepsake boxes, bookends and carved artifacts, hand-made since 1992 and shipped worldwide.",
  },
  {
    slug: "custom-bulk-orders",
    name: "Custom & Bulk Orders",
    description:
      "Hotel lobbies, restaurant counters, wholesale volumes and one-off commissions, drawn to your measurements and produced in our workshop.",
    seoTitle: "Custom & Bulk Onyx Orders | YT Onyx",
    seoDescription:
      "Bespoke onyx and marble commissions and wholesale volumes for hotels, studios and retailers. Send your drawings on WhatsApp for a quote.",
  },
];

const STONE_TYPES = [
  "Green Onyx",
  "White Onyx",
  "Honey Onyx",
  "Pink Onyx",
  "Multi Onyx",
  "Black Marble",
  "White Marble",
  "Beige Marble",
];

const COLORS: { name: string; hex: string }[] = [
  { name: "Green", hex: "#3F6B50" },
  { name: "White", hex: "#F1ECE1" },
  { name: "Honey", hex: "#C9924B" },
  { name: "Pink", hex: "#D8AA9B" },
  { name: "Black", hex: "#141414" },
  { name: "Grey", hex: "#8A8A8A" },
  { name: "Beige", hex: "#DDCBAE" },
  { name: "Multi", hex: "#A8793E" },
];

const FINISHES = ["Polished", "Honed", "Brushed", "Matte", "Antiqued"];

type DemoProduct = {
  slug: string;
  name: string;
  sku: string;
  category: string;
  stoneType: string;
  color: string;
  finish: string;
  priceCents: number;
  compareAtCents?: number;
  availability: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK";
  featured?: boolean;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  palette: StonePalette;
  shortDescription: string;
  description: string;
  careInstructions: string;
  seoTitle: string;
  seoDescription: string;
};

const CARE_POLISHED =
  "Dust with a soft dry cloth. Wipe spills quickly with warm water and a drop of pH-neutral soap, then dry. Avoid vinegar, citrus, bleach and bathroom descalers — acids etch the polish. Re-seal once a year with a stone sealer to keep the surface closed.";

const PRODUCTS: DemoProduct[] = [
  {
    slug: "nuri-onyx-table-lamp",
    name: "Nuri Onyx Table Lamp",
    sku: "YTO-LMP-001",
    category: "lighting",
    stoneType: "Honey Onyx",
    color: "Honey",
    finish: "Polished",
    priceCents: 38500,
    availability: "IN_STOCK",
    featured: true,
    length: 18,
    width: 18,
    height: 36,
    weight: 6.4,
    palette: "honeyOnyx",
    shortDescription:
      "A hand-turned honey onyx column that glows amber from the inside when lit.",
    description:
      "The Nuri lamp begins as a single block of honey onyx from the Chagai hills. It is cored, turned on the lathe and then walled down to eight millimetres — thin enough for light to pass through, thick enough to carry its own weight for a lifetime.\n\nLit, the stone turns the colour of dark honey and the banding inside the block becomes visible for the first time. Unlit, it reads as a quiet column of warm stone. Because the pattern is whatever the quarry laid down, no two lamps are the same, and we photograph each one before it ships.\n\nSupplied with a brass-finished fitting, a 1.8 m braided cable and an inline dimmer. Tell us your country on WhatsApp and we fit the matching plug and a 220V or 110V bulb before packing.",
    careInstructions: CARE_POLISHED,
    seoTitle: "Nuri Honey Onyx Table Lamp | YT Onyx",
    seoDescription:
      "Hand-turned honey onyx table lamp that glows amber when lit. Unique veining, brass fitting, dimmer included. Shipped worldwide from our workshop.",
  },
  {
    slug: "verdant-green-onyx-serving-board",
    name: "Verdant Green Onyx Serving Board",
    sku: "YTO-TBL-002",
    category: "tableware-kitchen",
    stoneType: "Green Onyx",
    color: "Green",
    finish: "Polished",
    priceCents: 16500,
    availability: "IN_STOCK",
    featured: true,
    length: 45,
    width: 25,
    height: 2,
    weight: 4.8,
    palette: "greenOnyx",
    shortDescription:
      "A cool, dense green onyx board for cheese, charcuterie and anything worth presenting properly.",
    description:
      "Cut from a single green onyx plate and eased by hand on all four edges, this board stays cool for hours — the reason stone has been used for cheese and pastry since long before refrigeration.\n\nThe green runs from deep forest through sage, crossed by the pale banding that marks good Pakistani onyx. We polish the face to a silk sheen and leave the underside honed so it grips the table rather than sliding on it.\n\nFood-safe sealed and ready to use. It doubles as a tray for decanters or bathroom bottles when it is not on the table.",
    careInstructions:
      "Hand wash only, with warm water and a drop of pH-neutral soap, then dry with a cloth. Do not put it in the dishwasher and do not cut directly on the surface — a knife will dull before the stone does, but it can leave marks. Keep citrus, vinegar and wine off the polish; wipe spills promptly.",
    seoTitle: "Green Onyx Serving Board | YT Onyx",
    seoDescription:
      "Hand-cut green onyx serving board for cheese and charcuterie. Food-safe sealed, polished face, honed base. Worldwide shipping.",
  },
  {
    slug: "sila-white-onyx-vessel-basin",
    name: "Sila White Onyx Vessel Basin",
    sku: "YTO-BTH-003",
    category: "bathroom",
    stoneType: "White Onyx",
    color: "White",
    finish: "Honed",
    priceCents: 64000,
    availability: "MADE_TO_ORDER",
    length: 42,
    width: 42,
    height: 15,
    weight: 22,
    palette: "whiteOnyx",
    shortDescription:
      "A vessel basin hollowed from one block of white onyx, honed smooth inside and out.",
    description:
      "Each Sila basin is cut from a solid block — never assembled, never veneered. The bowl is hollowed, ground and honed to a soft matte that feels warm underhand and hides water marks far better than a mirror polish.\n\nWhite onyx carries faint grey and cream drifts that shift as the light changes through the day. We select blocks with even translucency so that an underlit counter turns the whole basin into a lantern, if that is the effect you are after.\n\nDrilled to a standard 1.75\" / 44 mm waste. Tell us your tap position and counter depth on WhatsApp and we will confirm the cut before work starts. Made to order in four to five weeks.",
    careInstructions:
      "Rinse and dry after use to avoid mineral build-up. Clean with warm water and pH-neutral soap only — never limescale remover, bleach or anything acidic, which will etch the stone. Re-seal annually. A silicone-free plumber's putty is recommended at the waste.",
    seoTitle: "White Onyx Vessel Basin, Made to Order | YT Onyx",
    seoDescription:
      "Vessel basin carved from a single block of white onyx and honed by hand. Made to order, drilled for a standard waste, crated for export.",
  },
  {
    slug: "meridian-black-marble-side-table",
    name: "Meridian Black Marble Side Table",
    sku: "YTO-FRN-004",
    category: "furniture",
    stoneType: "Black Marble",
    color: "Black",
    finish: "Polished",
    priceCents: 118000,
    availability: "MADE_TO_ORDER",
    featured: true,
    length: 40,
    width: 40,
    height: 52,
    weight: 38,
    palette: "blackMarble",
    shortDescription:
      "A round black marble top on a tapered stone column, balanced by hand without a single bracket.",
    description:
      "The Meridian is two pieces of black marble and nothing else: a 40 cm disc and a tapered column, ground until they seat together so precisely that the join reads as a shadow line.\n\nBlack marble takes a deep, wet-looking polish and shows a fine grey filigree when the light rakes across it. We keep the edge of the top square with a 2 mm chamfer, so it stays architectural rather than decorative.\n\nAt 38 kg it is not a table you move often — which is rather the point. Supplied with felt pads and crated on a timber pallet for export.",
    careInstructions: CARE_POLISHED,
    seoTitle: "Meridian Black Marble Side Table | YT Onyx",
    seoDescription:
      "Solid black marble side table, hand-balanced disc and column, polished finish. Made to order and crated for worldwide shipping.",
  },
  {
    slug: "dusk-pink-onyx-candle-holders",
    name: "Dusk Pink Onyx Candle Holders, Pair",
    sku: "YTO-DEC-005",
    category: "home-decor",
    stoneType: "Pink Onyx",
    color: "Pink",
    finish: "Polished",
    priceCents: 14000,
    compareAtCents: 17500,
    availability: "IN_STOCK",
    length: 9,
    width: 9,
    height: 12,
    weight: 2.6,
    palette: "pinkOnyx",
    shortDescription:
      "Two turned pink onyx holders, one tall and one low, cut from the same block so the veining runs on.",
    description:
      "Pink onyx is the softest colour the quarries give us — rose, clay and off-white in thin bands that look painted. We turn these two holders from one block, in sequence, so the banding continues from the low piece to the tall one when they stand together.\n\nThe cups are sized for standard 22 mm dinner candles and recessed deep enough to catch the wax. Felt bases protect the table.\n\nSold as a pair. They sit as happily on a mantel or bathroom shelf as on a dining table.",
    careInstructions:
      "Let wax set hard, then lift it out with a wooden stick — never a blade. Dust with a dry cloth; clean with warm water and pH-neutral soap. Keep away from acidic cleaners and perfume overspray.",
    seoTitle: "Pink Onyx Candle Holders, Pair | YT Onyx",
    seoDescription:
      "A pair of hand-turned pink onyx candle holders cut from one block so the veining continues across both. Fits standard dinner candles.",
  },
  {
    slug: "heritage-onyx-chess-set",
    name: "Heritage Multi Onyx Chess Set",
    sku: "YTO-GFT-006",
    category: "gifts-artifacts",
    stoneType: "Multi Onyx",
    color: "Multi",
    finish: "Polished",
    priceCents: 52000,
    availability: "IN_STOCK",
    featured: true,
    length: 38,
    width: 38,
    height: 5,
    weight: 9.5,
    palette: "multiOnyx",
    shortDescription:
      "Thirty-two hand-turned pieces and a 38 cm inlaid board, in two contrasting onyx tones.",
    description:
      "Every piece is turned individually on the lathe, which is why a hand-made set has character a moulded one never does: the knights are carved, not cast, and no two are quite identical.\n\nThe board is built from 64 inlaid squares of honey and dark onyx, levelled, polished and edged with a banded border. It weighs enough to stay exactly where you put it mid-game.\n\nPacked in a fitted box with each piece wrapped separately. This is our most-requested wedding and retirement gift, and we can include a short handwritten note if you ask on WhatsApp.",
    careInstructions:
      "Dust the board with a dry cloth and wipe pieces with a barely damp one. Avoid soaking the inlaid board, as prolonged water can work into the joints. Store the pieces in their box to prevent chipping.",
    seoTitle: "Handmade Onyx Chess Set with Inlaid Board | YT Onyx",
    seoDescription:
      "Hand-turned onyx chess set: 32 pieces in contrasting tones with a 38 cm inlaid board. A gift that lasts generations. Shipped worldwide.",
  },
  {
    slug: "bookmatched-honey-onyx-slab-pair",
    name: "Bookmatched Honey Onyx Slab Pair",
    sku: "YTO-SLB-007",
    category: "slabs-tiles-surfaces",
    stoneType: "Honey Onyx",
    color: "Honey",
    finish: "Polished",
    priceCents: 240000,
    availability: "MADE_TO_ORDER",
    length: 240,
    width: 120,
    height: 2,
    weight: 155,
    palette: "honeyOnyx",
    shortDescription:
      "Two consecutive slabs cut from one block and opened like a book, for feature walls and bar fronts.",
    description:
      "A bookmatched pair is cut in sequence from the same block and polished so that the veining mirrors across the join. Opened on a wall or a bar front, the two halves form a single symmetrical pattern that cannot be reproduced from another block.\n\nThese are 20 mm slabs at roughly 240 × 120 cm, resin-backed for transit strength and suitable for backlighting — honey onyx is translucent enough that LED panels behind it turn the whole surface amber.\n\nBecause each pair is unique, we send photographs of the actual slabs on WhatsApp before you confirm, along with cutting and crating options for your project.",
    careInstructions:
      "Specify a penetrating sealer at installation and renew it yearly. Clean with pH-neutral stone soap only. Avoid acidic cleaners entirely — onyx is a calcium carbonate stone and etches on contact. For backlit installations, use LED panels that run cool.",
    seoTitle: "Bookmatched Honey Onyx Slabs for Feature Walls | YT Onyx",
    seoDescription:
      "Bookmatched honey onyx slab pairs, 240 × 120 cm, resin-backed and suitable for backlighting. Photographs of the actual slabs sent before you order.",
  },
  {
    slug: "atelier-marble-reception-counter",
    name: "Atelier Marble Reception Counter",
    sku: "YTO-CST-008",
    category: "custom-bulk-orders",
    stoneType: "Beige Marble",
    color: "Beige",
    finish: "Honed",
    priceCents: 650000,
    availability: "MADE_TO_ORDER",
    length: 300,
    width: 80,
    height: 105,
    weight: 620,
    palette: "beigeMarble",
    shortDescription:
      "A commissioned reception desk in beige marble, built to your drawings and installed in sections.",
    description:
      "This is an example of the commission work that fills most of our workshop calendar: a three-metre reception counter in honed beige marble, with a mitred front so the grain wraps the corner and a concealed cable run along the back.\n\nWe work from your drawings or sketch the piece with you over WhatsApp. You will receive block photographs, a cutting plan and a fixed quotation before anything is cut, then progress photographs through production.\n\nThe listed price is a reference for a counter of this size and specification. Lead time is eight to ten weeks and the piece ships in sections, crated and numbered, with an installation drawing for your fitter.",
    careInstructions:
      "Seal on installation and re-seal every twelve months in commercial use. Clean daily with a damp cloth and pH-neutral soap. Place mats under anything acidic. Honed marble can be re-honed in place if it is ever scratched, which is one of its advantages over engineered surfaces.",
    seoTitle: "Custom Marble Reception Counters & Commissions | YT Onyx",
    seoDescription:
      "Commissioned marble and onyx counters, desks and surfaces built to your drawings since 1992. Fixed quotation, progress photos, export crating.",
  },
];

/**
 * Starter testimonials. Replace these with real customer words from the
 * admin panel (Studio -> Testimonials) once you have permission to publish
 * them; they are only seeded when the table is completely empty.
 */
const TESTIMONIALS = [
  {
    quote:
      "The lamp arrived in Toronto in perfect condition, crated better than any furniture I have ordered. The glow at night is exactly what I hoped for.",
    name: "Interior client",
    location: "Toronto, Canada",
  },
  {
    quote:
      "We ordered bookmatched slabs for a bar front. They sent photographs of the actual pair before cutting, which made specifying it to our client effortless.",
    name: "Design studio",
    location: "Dubai, UAE",
  },
  {
    quote:
      "A chess set as a retirement gift. Hand-turned, heavy, beautifully finished — and they answered every question on WhatsApp within minutes.",
    name: "Private buyer",
    location: "London, United Kingdom",
  },
];

async function main() {
  console.log("Seeding YT Onyx…");

  // --- attributes ---------------------------------------------------------
  for (const [index, name] of STONE_TYPES.entries()) {
    const slug = slugify(name);
    await prisma.stoneType.upsert({
      where: { slug },
      update: { name, sortOrder: index },
      create: { name, slug, sortOrder: index },
    });
  }

  for (const [index, color] of COLORS.entries()) {
    const slug = slugify(color.name);
    await prisma.color.upsert({
      where: { slug },
      update: { name: color.name, hex: color.hex, sortOrder: index },
      create: { name: color.name, slug, hex: color.hex, sortOrder: index },
    });
  }

  for (const [index, name] of FINISHES.entries()) {
    const slug = slugify(name);
    await prisma.finish.upsert({
      where: { slug },
      update: { name, sortOrder: index },
      create: { name, slug, sortOrder: index },
    });
  }

  // --- categories ---------------------------------------------------------
  for (const [index, category] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { ...category, sortOrder: index },
      create: { ...category, sortOrder: index },
    });
  }

  // --- testimonials -------------------------------------------------------
  // Only seeded into an empty table, so a re-run never resurrects testimonials
  // the owner deleted.
  if ((await prisma.testimonial.count()) === 0) {
    for (const [index, testimonial] of TESTIMONIALS.entries()) {
      await prisma.testimonial.create({
        data: { ...testimonial, sortOrder: index, published: true },
      });
    }
  }

  // --- site settings ------------------------------------------------------
  // Created with sensible defaults; an existing row is never overwritten so a
  // re-run cannot wipe the owner's settings.
  await prisma.siteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      contactEmail: "hello@ytonyx.com",
      addressLine: "YT Onyx Workshop, Karachi, Pakistan",
      announcement:
        "Worldwide shipping · Message us on WhatsApp for a shipping quote to your country",
    },
  });

  // --- products -----------------------------------------------------------
  const [categories, stoneTypes, colors, finishes] = await Promise.all([
    prisma.category.findMany(),
    prisma.stoneType.findMany(),
    prisma.color.findMany(),
    prisma.finish.findMany(),
  ]);

  const categoryId = byKey(categories, (c) => c.slug);
  const stoneTypeId = byKey(stoneTypes, (s) => s.name);
  const colorId = byKey(colors, (c) => c.name);
  const finishId = byKey(finishes, (f) => f.name);

  for (const [index, item] of PRODUCTS.entries()) {
    const { palette, category, stoneType, color, finish, ...fields } = item;

    const data = {
      ...fields,
      categoryId: categoryId[category],
      stoneTypeId: stoneTypeId[stoneType],
      colorId: colorId[color],
      finishId: finishId[finish],
      dimensionUnit: "cm",
      weightUnit: "kg",
      published: true,
      publishedAt: new Date(Date.now() - index * 86_400_000),
      isDemo: true,
    };

    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      update: data,
      create: data,
      include: { images: true },
    });

    if (product.images.length === 0) {
      // Two angles per product, generated from the stone's own palette.
      for (let i = 0; i < 2; i += 1) {
        const image = await createDemoImage(palette, index * 31 + i * 7 + 3);
        await prisma.productImage.create({
          data: {
            productId: product.id,
            fileKey: image.fileKey,
            thumbKey: image.thumbKey,
            width: image.width,
            height: image.height,
            blurDataUrl: image.blurDataUrl,
            alt: `${item.name} — ${item.stoneType} detail ${i + 1}`,
            sortOrder: i,
            isPrimary: i === 0,
          },
        });
      }
      console.log(`  · ${item.name} (with demo imagery)`);
    } else {
      console.log(`  · ${item.name} (images kept)`);
    }
  }

  const counts = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.productImage.count(),
  ]);

  console.log(
    `Done. ${counts[0]} categories, ${counts[1]} products, ${counts[2]} images.`,
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function byKey<T>(rows: T[], key: (row: T) => string): Record<string, string> {
  return Object.fromEntries(
    rows.map((row) => [key(row), (row as { id: string }).id]),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
