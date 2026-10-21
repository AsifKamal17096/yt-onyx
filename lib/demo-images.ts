import { processAndStoreImage, type ProcessedImage } from "@/lib/images";
import sharp from "sharp";

/**
 * Generates the placeholder photography used by the demo catalogue.
 *
 * These are not fake product photos — they are polished-stone swatches drawn
 * from each piece's own palette, so the seeded shop looks finished without
 * pretending to show a real product. Delete the demo products from the admin
 * panel once real photography is uploaded.
 */

export type StonePalette = keyof typeof PALETTES;

/** [deep, mid, light, highlight] for each stone. */
const PALETTES = {
  greenOnyx: ["#16291f", "#3b6b4e", "#8cb795", "#dcebdb"],
  honeyOnyx: ["#4d2c0c", "#96601f", "#d6a259", "#f6e3ba"],
  whiteOnyx: ["#a89f8b", "#d6cfbe", "#f1ece1", "#fffdf8"],
  pinkOnyx: ["#7a4337", "#b87f6f", "#e5bcae", "#faeae2"],
  multiOnyx: ["#3c2c13", "#8a6730", "#c49a5f", "#eeddb5"],
  blackMarble: ["#050505", "#161616", "#343434", "#8a8a8a"],
  whiteMarble: ["#b9b6ae", "#ddd9d1", "#f4f2ed", "#ffffff"],
  beigeMarble: ["#7d6a4f", "#b09876", "#ddcbae", "#f6ecda"],
} as const;

/** Deterministic PRNG so re-seeding produces the same artwork. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SIZE = 1600;
/** Drawn oversized so the rotated band pattern still covers every corner. */
const PAD = 700;

function stoneSvg(palette: StonePalette, seed: number): string {
  const [deep, mid, light, highlight] = PALETTES[palette];
  const random = mulberry32(seed);
  const bandAngle = -35 + random() * 70;
  const layers: string[] = [];

  // Broad translucent bands: onyx is layered, so the surface reads as
  // parallel strata before any fine veining is drawn on top.
  let y = -PAD;
  while (y < SIZE + PAD) {
    const thickness = 40 + random() * 220;
    const tone = random();
    const colour = tone > 0.66 ? highlight : tone > 0.33 ? deep : light;
    layers.push(
      `<rect x="${-PAD}" y="${y.toFixed(0)}" width="${SIZE + PAD * 2}" height="${thickness.toFixed(
        0,
      )}" fill="${colour}" fill-opacity="${(0.05 + random() * 0.22).toFixed(3)}" />`,
    );
    y += thickness * (0.7 + random() * 0.9);
  }

  // Fine veins that wander across the bands.
  const veinCount = 26 + Math.floor(random() * 16);
  for (let i = 0; i < veinCount; i += 1) {
    const startY = -PAD + random() * (SIZE + PAD * 2);
    const bow = (random() - 0.5) * 420;
    const drift = (random() - 0.5) * 520;
    const thin = random() > 0.3;
    const colour = random() > 0.5 ? highlight : deep;
    layers.push(
      `<path d="M ${-PAD} ${startY.toFixed(0)} C ${SIZE * 0.35} ${(startY + bow).toFixed(0)}, ${(
        SIZE * 0.7
      ).toFixed(0)} ${(startY - bow).toFixed(0)}, ${SIZE + PAD} ${(startY + drift).toFixed(0)}" fill="none" stroke="${colour}" stroke-opacity="${(
        0.07 + random() * 0.3
      ).toFixed(3)}" stroke-width="${(thin ? 0.8 + random() * 2.2 : 3 + random() * 11).toFixed(
        1,
      )}" stroke-linecap="round" />`,
    );
  }

  // Soft translucent clouds add depth where the banding is sparse.
  const clouds: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    clouds.push(
      `<circle cx="${(random() * SIZE).toFixed(0)}" cy="${(random() * SIZE).toFixed(0)}" r="${(
        SIZE *
        (0.16 + random() * 0.26)
      ).toFixed(0)}" fill="url(#cloud${i % 2})" />`,
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="base" gradientTransform="rotate(${(20 + random() * 50).toFixed(1)})">
      <stop offset="0%" stop-color="${mid}" />
      <stop offset="48%" stop-color="${light}" />
      <stop offset="100%" stop-color="${mid}" />
    </linearGradient>
    <radialGradient id="cloud0">
      <stop offset="0%" stop-color="${highlight}" stop-opacity="0.34" />
      <stop offset="100%" stop-color="${highlight}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="cloud1">
      <stop offset="0%" stop-color="${deep}" stop-opacity="0.32" />
      <stop offset="100%" stop-color="${deep}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="sheen" cx="30%" cy="22%" r="58%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.26" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.45" />
    </radialGradient>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#base)" />
  <g transform="rotate(${bandAngle.toFixed(1)} ${SIZE / 2} ${SIZE / 2})">
    ${layers.join("\n    ")}
  </g>
  ${clouds.join("\n  ")}
  <rect width="${SIZE}" height="${SIZE}" fill="url(#sheen)" />
  <rect width="${SIZE}" height="${SIZE}" fill="url(#vignette)" />
</svg>`;
}

/**
 * Renders one swatch and pushes it through the normal upload pipeline, so demo
 * images are stored exactly like real uploads (WebP, thumbnail, blur hash).
 */
export async function createDemoImage(
  palette: StonePalette,
  seed: number,
): Promise<ProcessedImage> {
  const base = await sharp(Buffer.from(stoneSvg(palette, seed)))
    .png()
    .toBuffer();

  // A whisper of grain over the vectors keeps the surface from looking plastic.
  const grain = await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: "#808080",
      noise: { type: "gaussian", mean: 128, sigma: 9 },
    },
  })
    .png()
    .toBuffer();

  const textured = await sharp(base)
    .composite([{ input: grain, blend: "soft-light" }])
    .png()
    .toBuffer();

  return processAndStoreImage(textured, "demo");
}
