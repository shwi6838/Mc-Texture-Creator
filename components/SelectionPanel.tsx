"use client";

import { useEffect, useState } from "react";
import { PaintBucket, X } from "lucide-react";
import { useEditorStore } from "@/lib/store";

export default function SelectionPanel() {
  const selection = useEditorStore((s) => s.selection);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const previewSelectionAdjust = useEditorStore((s) => s.previewSelectionAdjust);
  const commitSelectionAdjust = useEditorStore((s) => s.commitSelectionAdjust);
  const fillSelection = useEditorStore((s) => s.fillSelection);

  const [brightness, setBrightness] = useState(0);
  const [alpha, setAlpha] = useState(0);

  // A new marquee (or a fill) re-baselines in the store — reset the sliders
  // to match so they don't silently re-apply a stale adjustment.
  useEffect(() => {
    setBrightness(0);
    setAlpha(0);
  }, [selection?.minX, selection?.minY, selection?.maxX, selection?.maxY]);

  if (!selection) {
    return (
      <p className="text-[11px] text-stone-500">
        Pick the Select tool and drag on the canvas to mark an area. You can then fill it or
        adjust its brightness and alpha without touching the rest of the texture.
      </p>
    );
  }

  const width = selection.maxX - selection.minX + 1;
  const height = selection.maxY - selection.minY + 1;

  function reset() {
    setBrightness(0);
    setAlpha(0);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-[11px] text-stone-400">
        <span>
          {width} × {height} selection
        </span>
        <button
          onClick={() => {
            clearSelection();
            reset();
          }}
          className="flex items-center gap-1 text-stone-400 hover:text-redstone-400"
        >
          <X size={13} /> Clear
        </button>
      </div>

      <button
        onClick={() => {
          fillSelection();
          reset();
        }}
        className="flex items-center justify-center gap-2 bg-stone-800 px-3 py-2 pixel-border text-sm text-stone-100 hover:bg-stone-700"
      >
        <PaintBucket size={15} /> Fill selection with color
      </button>

      <label className="flex flex-col gap-1 text-[11px] text-stone-400">
        Brightness ({brightness > 0 ? "+" : ""}
        {brightness})
        <input
          type="range"
          min={-100}
          max={100}
          value={brightness}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setBrightness(v);
            previewSelectionAdjust(v, alpha);
          }}
          onPointerUp={commitSelectionAdjust}
        />
      </label>

      <label className="flex flex-col gap-1 text-[11px] text-stone-400">
        Alpha ({alpha > 0 ? "+" : ""}
        {alpha})
        <input
          type="range"
          min={-100}
          max={100}
          value={alpha}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setAlpha(v);
            previewSelectionAdjust(brightness, v);
          }}
          onPointerUp={commitSelectionAdjust}
        />
      </label>
    </div>
  );
}
