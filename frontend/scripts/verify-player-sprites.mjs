import { readFile } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";

const root = process.cwd();
const expected = {
  "Chaz.PNG": { width: 137, height: 260, bbox: [5, 12, 132, 248] },
  "Laga.PNG": { width: 134, height: 260, bbox: [5, 11, 129, 249] },
  "Kevin.PNG": { width: 123, height: 260, bbox: [4, 12, 119, 248] },
  "GJ.PNG": { width: 129, height: 260, bbox: [5, 12, 124, 248] },
};

let failed = false;

for (const [fileName, constraints] of Object.entries(expected)) {
  const filePath = path.join(root, "public", "images", "trainers", "player", fileName);
  try {
    const image = PNG.sync.read(await readFile(filePath));
    const bbox = alphaBoundingBox(image);
    const topTransparent = bbox ? bbox[1] / image.height : 0;
    const bottomTransparent = bbox ? (image.height - bbox[3]) / image.height : 0;

    const problems = [];
    if (image.width < constraints.width || image.height < constraints.height) {
      problems.push(`dimensions ${image.width}x${image.height} below ${constraints.width}x${constraints.height}`);
    }
    if (!bbox) {
      problems.push("no visible alpha pixels");
    } else {
      const [left, top, right, bottom] = bbox;
      const [minLeft, minTop, maxRight, maxBottom] = constraints.bbox;
      if (bottom >= image.height) problems.push("visible pixels touch bottom edge");
      if (top <= 0) problems.push("visible pixels touch top edge");
      if (left < minLeft || top < minTop || right > maxRight || bottom > maxBottom) {
        problems.push(`alpha bbox ${bbox.join(",")} outside expected ${constraints.bbox.join(",")}`);
      }
      if (bottomTransparent < 0.04) problems.push("less than 4% transparent canvas below artwork");
    }

    console.log(
      `${fileName}: ${image.width}x${image.height}, alpha bbox ${bbox?.join(",") ?? "none"}, top transparent ${(topTransparent * 100).toFixed(2)}%, bottom transparent ${(bottomTransparent * 100).toFixed(2)}%`,
    );

    if (problems.length > 0) {
      failed = true;
      console.error(`  FAIL: ${problems.join("; ")}`);
    }
  } catch (error) {
    failed = true;
    console.error(`${fileName}: FAIL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (failed) {
  process.exit(1);
}

function alphaBoundingBox(image) {
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[(image.width * y + x) * 4 + 3];
      if (alpha > 0) {
        if (x < left) left = x;
        if (y < top) top = y;
        if (x + 1 > right) right = x + 1;
        if (y + 1 > bottom) bottom = y + 1;
      }
    }
  }

  return right === -1 ? null : [left, top, right, bottom];
}
