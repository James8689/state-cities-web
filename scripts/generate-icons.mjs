/**
 * Renders public/icon-source.svg into PNG sizes used by the PWA manifest,
 * Apple touch icon, and App Store listing (1024×1024).
 *
 * Usage: node scripts/generate-icons.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "public", "icon-source.svg");
const svg = readFileSync(source);

const outputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-1024.png", size: 1024 },
];

for (const { file, size } of outputs) {
  const out = join(root, "public", file);
  const png = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(out, png);
  console.log(`Wrote ${file} (${size}×${size})`);
}
