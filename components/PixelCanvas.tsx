"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store";
import { TEXTURE_SIZE, TextureGrid } from "@/lib/types";

const CELL = 24; // on-screen pixel size in CSS px
const SIZE = CELL * TEXTURE_SIZE;

function bresenham(x0: number, y0: number, x1: number, y1: number) {
  const points: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = -Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    points.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

export default function PixelCanvas() {
  const project = useEditorStore((s) => s.project);
  const activeFace = useEditorStore((s) => s.activeFace);
  const tool = useEditorStore((s) => s.tool);
  const activeColor = useEditorStore((s) => s.activeColor);
  const paintPixel = useEditorStore((s) => s.paintPixel);
  const erasePixel = useEditorStore((s) => s.erasePixel);
  const eyedrop = useEditorStore((s) => s.eyedrop);
  const floodFill = useEditorStore((s) => s.floodFill);
  const setFaceGrid = useEditorStore((s) => s.setFaceGrid);
  const selection = useEditorStore((s) => s.selection);
  const setSelection = useEditorStore((s) => s.setSelection);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") clearSelection();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection]);

  const grid = project.faces[activeFace];
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<[number, number] | null>(null);
  const [linePreview, setLinePreview] = useState<TextureGrid | null>(null);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [marqueeStart, setMarqueeStart] = useState<[number, number] | null>(null);
  const [marqueeEnd, setMarqueeEnd] = useState<[number, number] | null>(null);

  const coordsFromEvent = useCallback((e: React.PointerEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * TEXTURE_SIZE);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * TEXTURE_SIZE);
    return [
      Math.min(Math.max(x, 0), TEXTURE_SIZE - 1),
      Math.min(Math.max(y, 0), TEXTURE_SIZE - 1),
    ] as [number, number];
  }, []);

  const indexFor = (x: number, y: number) => y * TEXTURE_SIZE + x;

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    const [x, y] = coordsFromEvent(e);
    const idx = indexFor(x, y);
    if (tool === "pencil" || tool === "eraser") {
      setIsDrawing(true);
      if (tool === "eraser") erasePixel(idx);
      else paintPixel(idx);
    } else if (tool === "fill") {
      floodFill(idx);
    } else if (tool === "eyedropper") {
      eyedrop(idx);
    } else if (tool === "line") {
      setLineStart([x, y]);
    } else if (tool === "select") {
      setMarqueeStart([x, y]);
      setMarqueeEnd([x, y]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const [x, y] = coordsFromEvent(e);
    setHover([x, y]);
    if (isDrawing && (tool === "pencil" || tool === "eraser")) {
      if (tool === "eraser") erasePixel(indexFor(x, y));
      else paintPixel(indexFor(x, y));
    } else if (tool === "line" && lineStart) {
      const pts = bresenham(lineStart[0], lineStart[1], x, y);
      const preview = [...grid];
      pts.forEach(([px, py]) => {
        preview[indexFor(px, py)] = activeColor;
      });
      setLinePreview(preview);
    } else if (tool === "select" && marqueeStart) {
      setMarqueeEnd([x, y]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false);
    if (tool === "line" && lineStart && linePreview) {
      setFaceGrid(activeFace, linePreview);
    }
    if (tool === "select" && marqueeStart && marqueeEnd) {
      setSelection({
        minX: Math.min(marqueeStart[0], marqueeEnd[0]),
        maxX: Math.max(marqueeStart[0], marqueeEnd[0]),
        minY: Math.min(marqueeStart[1], marqueeEnd[1]),
        maxY: Math.max(marqueeStart[1], marqueeEnd[1]),
      });
    }
    setLineStart(null);
    setLinePreview(null);
    setMarqueeStart(null);
    setMarqueeEnd(null);
  };

  const displayGrid = linePreview ?? grid;

  const cells = useMemo(() => {
    return displayGrid.map((color, i) => {
      const x = i % TEXTURE_SIZE;
      const y = Math.floor(i / TEXTURE_SIZE);
      return (
        <div
          key={i}
          className="absolute"
          style={{
            left: x * CELL,
            top: y * CELL,
            width: CELL,
            height: CELL,
            backgroundColor: color ?? "transparent",
          }}
        />
      );
    });
  }, [displayGrid]);

  return (
    <div className="inline-block select-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => setHover(null)}
        className="checker-bg relative pixel-border cursor-crosshair touch-none"
        style={{ width: SIZE, height: SIZE }}
      >
        {cells}
        {/* grid lines every 4 px for scale reference */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={SIZE}
          height={SIZE}
        >
          {Array.from({ length: TEXTURE_SIZE + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * CELL}
              y1={0}
              x2={i * CELL}
              y2={SIZE}
              stroke="#000"
              strokeOpacity={i % 4 === 0 ? 0.35 : 0.12}
              strokeWidth={i % 4 === 0 ? 1.5 : 1}
            />
          ))}
          {Array.from({ length: TEXTURE_SIZE + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * CELL}
              x2={SIZE}
              y2={i * CELL}
              stroke="#000"
              strokeOpacity={i % 4 === 0 ? 0.35 : 0.12}
              strokeWidth={i % 4 === 0 ? 1.5 : 1}
            />
          ))}
          {hover && (
            <rect
              x={hover[0] * CELL}
              y={hover[1] * CELL}
              width={CELL}
              height={CELL}
              fill="none"
              stroke="#f0ece2"
              strokeWidth={2}
            />
          )}
          {marqueeStart && marqueeEnd && (
            <rect
              x={Math.min(marqueeStart[0], marqueeEnd[0]) * CELL}
              y={Math.min(marqueeStart[1], marqueeEnd[1]) * CELL}
              width={(Math.abs(marqueeEnd[0] - marqueeStart[0]) + 1) * CELL}
              height={(Math.abs(marqueeEnd[1] - marqueeStart[1]) + 1) * CELL}
              fill="#4c76b8"
              fillOpacity={0.25}
              stroke="#4c76b8"
              strokeWidth={2}
            />
          )}
          {!marqueeStart && selection && (
            <rect
              x={selection.minX * CELL}
              y={selection.minY * CELL}
              width={(selection.maxX - selection.minX + 1) * CELL}
              height={(selection.maxY - selection.minY + 1) * CELL}
              fill="none"
              stroke="#dcb27e"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-stone-300">
        <span>16 × 16</span>
        {hover && (
          <span>
            x:{hover[0]} y:{hover[1]}
          </span>
        )}
      </div>
    </div>
  );
}
