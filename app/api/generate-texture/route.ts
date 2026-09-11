import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pixelateQuantize } from "@/lib/quantize";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are a pixel artist generating 16x16 block textures for Minecraft: Bedrock Edition.
You output ONLY a JSON array of exactly 256 strings, row-major from the top-left pixel to the
bottom-right pixel (16 rows of 16 pixels). Each string is either:
- an 8-digit RGBA hex color like "#8a5a34ff" (fully opaque unless the material is meant to be
  see-through, like glass or leaves), or
- null for a fully transparent pixel (only use this for genuinely transparent materials).

Style rules:
- Draw in the blocky, hand-painted Minecraft texture style: visible pixel clusters, no smooth
  gradients or anti-aliasing, no outlines around the whole canvas.
- Use 5-8 closely related colors with subtle value variation (noise/speckle) so the surface
  reads as a natural material, not a flat fill.
- Keep the design tileable: the left/right edges and top/bottom edges should read continuously
  if the texture repeats.
- Respond with raw JSON only: no markdown fences, no prose, no keys other than the array itself.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: { prompt?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(
      `Generate a 16x16 Minecraft block texture for: "${prompt}"`,
    );
    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let pixels: (string | null)[];
    try {
      pixels = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "The model returned a response that could not be parsed as pixel data." },
        { status: 502 },
      );
    }

    if (!Array.isArray(pixels) || pixels.length !== 256) {
      return NextResponse.json(
        { error: "The model did not return exactly 256 pixels." },
        { status: 502 },
      );
    }

    const normalized = pixels.map((p) => {
      if (p === null) return null;
      if (typeof p !== "string") return null;
      const hex = p.startsWith("#") ? p : `#${p}`;
      if (/^#[0-9a-fA-F]{8}$/.test(hex)) return hex.toLowerCase();
      if (/^#[0-9a-fA-F]{6}$/.test(hex)) return (hex + "ff").toLowerCase();
      return null;
    });

    // Free "pixelation" pass: collapse the palette to a small, cohesive set
    // of colors so the result reads as clean pixel art rather than whatever
    // slightly-inconsistent color choices the model made pixel-to-pixel.
    const pixelated = pixelateQuantize(normalized, 7);

    return NextResponse.json({ pixels: pixelated });
  } catch (err: any) {
    const message: string = err?.message ?? "Failed to generate texture.";
    // Surface Gemini's free-tier rate limit clearly rather than a generic 500.
    const status = /quota|rate/i.test(message) ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
