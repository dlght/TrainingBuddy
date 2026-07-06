/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs/promises");
const path = require("node:path");

const outputDirectory = path.resolve(__dirname, "..", "assets", "seed-exercises");
const placeholderPath = path.join(outputDirectory, "placeholder.txt");

const selectedImages = [
  // Add curated wger image URLs here during seed finalization.
  // { id: "bodyweight-squat", url: "https://..." }
];

async function ensurePlaceholder() {
  await fs.mkdir(outputDirectory, { recursive: true });

  try {
    await fs.access(placeholderPath);
  } catch {
    await fs.writeFile(
      placeholderPath,
      "Placeholder for bundled seed exercise imagery. Replace with curated licensed assets in Phase 8.\n"
    );
  }
}

async function downloadImage(entry) {
  const response = await fetch(entry.url);

  if (!response.ok) {
    throw new Error(`Failed to download ${entry.id}: ${response.status} ${response.statusText}`);
  }

  const extension = path.extname(new URL(entry.url).pathname) || ".webp";
  const outputPath = path.join(outputDirectory, `${entry.id}${extension}`);
  const bytes = Buffer.from(await response.arrayBuffer());

  await fs.writeFile(outputPath, bytes);

  return outputPath;
}

async function main() {
  await ensurePlaceholder();

  if (selectedImages.length === 0) {
    console.log("No remote seed image URLs configured. Placeholder seed asset is ready.");
    return;
  }

  for (const entry of selectedImages) {
    const outputPath = await downloadImage(entry);
    console.log(`Saved ${entry.id} to ${outputPath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
