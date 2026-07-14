import { readFile } from "node:fs/promises";
import path from "node:path";

const TRAINER_PARTS: Record<string, string[]> = {
  chaz: ["chaz.1", "chaz.2"],
  laga: ["laga"],
  kevin: ["kevin.1", "kevin.2", "kevin.3"],
  gj: ["gj.1", "gj.2", "gj.3"],
};

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ trainer: string }> },
) {
  const { trainer } = await context.params;
  const parts = TRAINER_PARTS[trainer.toLowerCase()];

  if (!parts) {
    return new Response("Trainer sprite not found", { status: 404 });
  }

  try {
    const assetRoot = path.join(process.cwd(), "..", ".trainer-assets");
    const base64Parts = await Promise.all(
      parts.map((part) => readFile(path.join(assetRoot, part), "utf8")),
    );
    const image = Buffer.from(base64Parts.join("").replace(/\s+/g, ""), "base64");

    return new Response(image, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(image.byteLength),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch {
    return new Response("Trainer sprite unavailable", { status: 500 });
  }
}
