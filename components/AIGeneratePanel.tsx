"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { PixelColor } from "@/lib/types";

export default function AIGeneratePanel() {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const activeFace = useEditorStore((s) => s.activeFace);
  const setFaceGrid = useEditorStore((s) => s.setFaceGrid);
  const isGenerating = useEditorStore((s) => s.isGenerating);
  const setGenerating = useEditorStore((s) => s.setGenerating);

  async function handleGenerate() {
    if (!prompt.trim() || isGenerating) return;
    setError(null);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-texture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setFaceGrid(activeFace, data.pixels as PixelColor[]);
    } catch (e: any) {
      setError(e?.message ?? "Network error.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. cracked grey cobblestone with moss in the corners"
        rows={3}
        className="resize-none bg-stone-800 px-2 py-1.5 pixel-border text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:bg-stone-700"
      />
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="flex items-center justify-center gap-2 bg-lapis-500 px-3 py-2 pixel-border text-sm font-medium text-stone-100 hover:bg-lapis-400 disabled:opacity-40"
      >
        {isGenerating ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Painting pixels…
          </>
        ) : (
          <>
            <Sparkles size={15} /> Generate for this face
          </>
        )}
      </button>
      {error && <p className="text-[11px] text-redstone-400">{error}</p>}
      <p className="text-[11px] text-stone-500">
        Fills the active face ({activeFace}). Uses Google Gemini's free tier, then a local
        color-quantization pass to keep the palette clean. Requires GEMINI_API_KEY to be set
        on the server.
      </p>
    </div>
  );
}
