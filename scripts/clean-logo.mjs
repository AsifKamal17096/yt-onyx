/**
 * Rebuilds the brand logo assets from the original photo-style JPEG.
 *
 *   public/logo.jpeg  (original, never modified)
 *     -> public/logo-clean.png     white mark on solid #0A0A0A, square
 *     -> public/logo-mark.png      white mark on transparency
 *     -> public/og-default.png     1200x630 Open Graph card
 *     -> app/icon.png              favicon source
 *
 * Two generator watermarks are removed: an "AI" chip in the top-left corner
 * and a "DreaminaAI" signature in the bottom-right. Both sit outside the
 * circular badge, so they are erased without cropping horizontally and
 * without masking the artwork into a circle (the "YT ONYX" lettering runs to
 * both edges and must stay intact).
 *
 * Technique: the source is white line art on black, so its luminance doubles
 * as an alpha channel. Rebuilding the mark over a flat brand-black canvas
 * removes JPEG noise and the slight vignette of the original at the same time.
 *
 * Run with: npm run logo:clean
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "public", "logo.jpeg");
const SIZE = 1024;
const INK = { r: 10, g: 10, b: 10 };

/**
 * Watermark areas, expressed as fractions of the source square so the script
 * keeps working if the logo is ever re-exported at another resolution.
 */
const WATERMARKS = [
  { name: "AI chip", left: 0, top: 0, width: 0.072, height: 0.063 },
  {
    name: "DreaminaAI signature",
    left: 0.724,
    top: 0.898,
    width: 0.276,
    height: 0.102,
  },
];

const px = (fraction) => Math.round(fraction * SIZE);

async function buildAlphaMark() {
  // Luminance of the source, contrast-stretched so the near-black background
  // falls to a true zero and the white strokes keep their anti-aliasing.
  const base = sharp(SOURCE)
    .rotate() // honour EXIF orientation before anything else
    .resize(SIZE, SIZE, { fit: "cover" })
    .greyscale()
    .normalise()
    .linear(1.45, -34);

  const erased = await base
    .composite(
      WATERMARKS.map((area) => ({
        input: {
          create: {
            width: px(area.width),
            height: px(area.height),
            channels: 3,
            background: "#000000",
          },
        },
        left: px(area.left),
        top: px(area.top),
      })),
    )
    .raw()
    .toBuffer();

  const white = await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: "#ffffff",
    },
  })
    .raw()
    .toBuffer();

  // White pixels + luminance as alpha = the mark with a transparent backdrop.
  return sharp(white, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .joinChannel(erased, { raw: { width: SIZE, height: SIZE, channels: 1 } })
    .png({ compressionLevel: 9 });
}

async function main() {
  const mark = await buildAlphaMark();
  const markBuffer = await mark.toBuffer();

  await mkdir(path.join(root, "public"), { recursive: true });

  await sharp(markBuffer)
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "public", "logo-mark.png"));

  const cleanBuffer = await sharp(markBuffer)
    .flatten({ background: INK })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp(cleanBuffer).toFile(path.join(root, "public", "logo-clean.png"));

  // Favicon source. Next.js picks up app/icon.png automatically.
  await sharp(cleanBuffer)
    .resize(512, 512)
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "app", "icon.png"));

  // Open Graph card: the badge centred on brand black, safe for WhatsApp
  // link previews which crop to roughly 1.91:1.
  const ogMark = await sharp(markBuffer).resize(468, 468).toBuffer();
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: INK,
    },
  })
    .composite([{ input: ogMark, left: Math.round((1200 - 468) / 2), top: 81 }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(root, "public", "og-default.png"));

  console.log("Logo assets written:");
  console.log("  public/logo-clean.png");
  console.log("  public/logo-mark.png");
  console.log("  public/og-default.png");
  console.log("  app/icon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
