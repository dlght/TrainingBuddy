// One-off script to generate PWA icon assets from assets/icon.png using
// Expo's bundled image-utils (falls back to pure-JS jimp when sharp isn't installed).
const fs = require("fs");
const path = require("path");
const { generateImageAsync } = require("@expo/image-utils");

const projectRoot = path.resolve(__dirname, "..");
const src = path.join(projectRoot, "assets", "icon.png");
const outDir = path.join(projectRoot, "public", "icons");

const targets = [
  { name: "icon-192.png", width: 192, height: 192 },
  { name: "icon-512.png", width: 512, height: 512 },
  { name: "icon-512-maskable.png", width: 512, height: 512 },
  { name: "apple-touch-icon.png", width: 180, height: 180 }
];

async function main() {
  for (const target of targets) {
    const { source } = await generateImageAsync(
      { projectRoot },
      {
        src,
        width: target.width,
        height: target.height,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        name: target.name
      }
    );
    fs.writeFileSync(path.join(outDir, target.name), source);
    console.log("wrote", target.name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
