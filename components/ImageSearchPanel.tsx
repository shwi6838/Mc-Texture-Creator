"use client";

import { useState } from "react";
import { Search, Loader2, ImageOff } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { PixelColor } from "@/lib/types";

interface Photo {
  id: number;
  thumbnail: string;
  full: string;
  photographer: string;
  photographerUrl: string;
  pexelsUrl: string;
  alt: string;
}

export default function ImageSearchPanel() {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [searching, setSearching] = useState(false);
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFace = useEditorStore((s) => s.activeFace);
  const setFaceGrid = useEditorStore((s) => s.setFaceGrid);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/search-images?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        setPhotos([]);
        return;
      }
      setPhotos(data.photos ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Network error.");
    } finally {
      setSearching(false);
    }
  }

  async function handlePick(photo: Photo) {
    if (convertingId !== null) return;
    setConvertingId(photo.id);
    setError(null);
    try {
      const res = await fetch("/api/image-to-texture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: photo.full }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not convert that photo.");
        return;
      }
      setFaceGrid(activeFace, data.pixels as PixelColor[]);
    } catch (e: any) {
      setError(e?.message ?? "Network error.");
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSearch} className="flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. shale rock"
          className="flex-1 bg-stone-800 px-2 py-1.5 pixel-border text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:bg-stone-700"
        />
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center bg-lapis-500 pixel-border text-stone-100 hover:bg-lapis-400 disabled:opacity-40"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
      </form>

      {error && <p className="text-[11px] text-redstone-400">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => handlePick(photo)}
              disabled={convertingId !== null}
              title={`Use this photo — by ${photo.photographer} on Pexels`}
              className="group relative aspect-square overflow-hidden pixel-border bg-stone-800 disabled:opacity-60"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnail}
                alt={photo.alt}
                className="h-full w-full object-cover"
              />
              {convertingId === photo.id && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-950/70">
                  <Loader2 size={18} className="animate-spin text-stone-100" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {photos.length === 0 && !searching && (
        <p className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <ImageOff size={13} /> Search a material (e.g. "shale rock", "rusted metal") to pick a
          reference photo.
        </p>
      )}

      <p className="text-[11px] text-stone-500">
        Fills the active face ({activeFace}). Crops the photo to a square, shrinks it to 16×16,
        and cleans the palette down to a small set of colors. Photos via{" "}
        <a
          href="https://www.pexels.com"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-stone-300"
        >
          Pexels
        </a>
        .
      </p>
    </div>
  );
}
