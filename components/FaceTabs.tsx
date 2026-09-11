"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/lib/store";
import { FACE_LABELS, FACE_NAMES, TEXTURE_SIZE, TextureGrid } from "@/lib/types";

function FaceThumb({ grid }: { grid: TextureGrid }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE);
    for (let i = 0; i < grid.length; i++) {
      const hex = grid[i];
      const o = i * 4;
      if (!hex) continue;
      imageData.data[o] = parseInt(hex.slice(1, 3), 16);
      imageData.data[o + 1] = parseInt(hex.slice(3, 5), 16);
      imageData.data[o + 2] = parseInt(hex.slice(5, 7), 16);
      imageData.data[o + 3] = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255;
    }
    ctx.putImageData(imageData, 0, 0);
  }, [grid]);
  return (
    <canvas
      ref={canvasRef}
      width={TEXTURE_SIZE}
      height={TEXTURE_SIZE}
      className="checker-bg h-8 w-8"
    />
  );
}

export default function FaceTabs() {
  const project = useEditorStore((s) => s.project);
  const activeFace = useEditorStore((s) => s.activeFace);
  const setActiveFace = useEditorStore((s) => s.setActiveFace);

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {FACE_NAMES.map((face) => (
        <button
          key={face}
          onClick={() => setActiveFace(face)}
          className={`flex flex-col items-center gap-1 px-2 py-1.5 pixel-border ${
            activeFace === face ? "bg-oak-500 text-stone-950" : "bg-stone-800 text-stone-200"
          }`}
        >
          <FaceThumb grid={project.faces[face]} />
          <span className="text-[10px]">{FACE_LABELS[face]}</span>
        </button>
      ))}
    </div>
  );
}
