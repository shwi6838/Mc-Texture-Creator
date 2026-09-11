import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { pixelateQuantize } from "@/lib/quantize";
import { TEXTURE_SIZE } from "@/lib/types";

export const runtime = "nodejs";

function toHex2(n: number): string {
  return n.toString(16).padStart(2, "0");
}

export async function POST(req: NextRequest) {
  let body: { imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const imageUrl = body.imageUrl;
  if (!imageUrl || !/^https?:\/\//.test(imageUrl)) {
    return NextResponse.json({ error: "Missing or invalid imageUrl." }, { status: 400 });
  }

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `Could not fetch the source image (${imgRes.status}).` },
        { status: 502 },
      );
    }
    const sourceBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Crop to a centered square, then downsample to 16x16. Sharp's default
    // resize kernel averages the source pixels it's collapsing, so this
    // gives a coherent color-per-region result rather than sampling noise.
    const raw = await sharp(sourceBuffer)
      .resize(TEXTURE_SIZE, TEXTURE_SIZE, { fit: "cover" })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const pixels: string[] = [];
    for (let i = 0; i < TEXTURE_SIZE * TEXTURE_SIZE; i++) {
      const o = i * 4;
      pixels.push(
        `#${toHex2(raw[o])}${toHex2(raw[o + 1])}${toHex2(raw[o + 2])}${toHex2(raw[o + 3])}`,
      );
    }

    // Real photos have thousands of subtly different colors; collapse them
    // down to a small palette so the result reads as a hand-painted block
    // texture rather than a blurry photo thumbnail.
    const pixelated = pixelateQuantize(pixels, 10);

    return NextResponse.json({ pixels: pixelated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to convert image to a texture." },
      { status: 500 },
    );
  }
}
