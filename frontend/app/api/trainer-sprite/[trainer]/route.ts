import { readFile } from "node:fs/promises";
import path from "node:path";

const TRAINER_PARTS: Record<string, string[]> = {
  chaz: ["chaz.1", "chaz.2"],
  laga: ["laga"],
  kevin: ["kevin.1", "kevin.2", "kevin.3"],
  gj: ["gj.1", "gj.2", "gj.3"],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const body = new Uint8Array(image.buffer, image.byteOffset, image.byteLength);

    return new Response(body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(body.byteLength),
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Trainer sprite unavailable", { status: 500 });
  }
}
