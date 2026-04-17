/**
 * Generates public/icon-192.png and public/icon-512.png from public/icon.svg
 * Run once: node scripts/generate-icons.mjs
 *
 * Requires: npm install -D sharp (dev dep, not bundled)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error(
    "sharp not installed. Run: npm install -D sharp\nThen: node scripts/generate-icons.mjs"
  );
  process.exit(1);
}

const svgBuffer = readFileSync(join(root, "public", "icon.svg"));

for (const size of [192, 512]) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(join(root, "public", `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
