/**
 * Renders public/icon-source.png into PNG sizes for PWA, iOS, and Android.
 *
 * Place a 1024×1024 master at public/icon-source.png, then run:
 *   npm run icons
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "public", "icon-source.png");

if (!existsSync(source)) {
  console.error("Missing public/icon-source.png (1024×1024 master PNG).");
  process.exit(1);
}

async function writePng(size, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const png = await sharp(source).resize(size, size).png().toBuffer();
  writeFileSync(outPath, png);
  console.log(`Wrote ${outPath.replace(root + "\\", "").replace(root + "/", "")} (${size}×${size})`);
}

const webOutputs = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-1024.png", size: 1024 },
];

for (const { file, size } of webOutputs) {
  await writePng(size, join(root, "public", file));
}

await writePng(
  1024,
  join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png"),
);

const androidDensities = [
  { folder: "mipmap-mdpi", size: 48 },
  { folder: "mipmap-hdpi", size: 72 },
  { folder: "mipmap-xhdpi", size: 96 },
  { folder: "mipmap-xxhdpi", size: 144 },
  { folder: "mipmap-xxxhdpi", size: 192 },
];

for (const { folder, size } of androidDensities) {
  const base = join(root, "android", "app", "src", "main", "res", folder);
  await writePng(size, join(base, "ic_launcher.png"));
  await writePng(size, join(base, "ic_launcher_round.png"));
}
