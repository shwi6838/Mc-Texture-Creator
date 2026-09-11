import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface PexelsPhoto {
  id: number;
  photographer: string;
  photographer_url: string;
  url: string;
  alt: string;
  src: {
    medium: string;
    large: string;
    large2x: string;
    original: string;
  };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "PEXELS_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  const query = (req.nextUrl.searchParams.get("query") ?? "").trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`,
      { headers: { Authorization: apiKey } },
    );

    if (!res.ok) {
      const status = res.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: `Pexels returned an error (${res.status}).` },
        { status },
      );
    }

    const data: { photos: PexelsPhoto[] } = await res.json();
    const photos = (data.photos ?? []).map((p) => ({
      id: p.id,
      thumbnail: p.src.medium,
      full: p.src.large2x ?? p.src.large ?? p.src.original,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      pexelsUrl: p.url,
      alt: p.alt || query,
    }));

    return NextResponse.json({ photos });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to search images." },
      { status: 500 },
    );
  }
}
