// generate-icons.js
import sharp from "sharp";
import fs from "fs";

// const sizes = [192, 512]; // you can add more sizes if needed
const sizes = [1024,180]; // you can add more sizes if needed
const inputFile = "public/favicon.svg";
const outputDir = "public/icons";

// ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

sizes.forEach(async (size) => {
  const outputFile = `${outputDir}/logo-${size}x${size}.png`;
  try {
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputFile);
    console.log(`✅ Generated: ${outputFile}`);
  } catch (err) {
    console.error(`❌ Error generating ${outputFile}`, err);
  }
});
