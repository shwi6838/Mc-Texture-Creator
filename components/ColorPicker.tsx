"use client";

import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "@/lib/store";
import { Plus } from "lucide-react";

const WHEEL_SIZE = 148;

function hsvToRgb(h: number, s: number, v: number) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function rgbToHsv(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return [h, s, max];
}

function toHex2(n: number) {
  return n.toString(16).padStart(2, "0");
}

function rgbaToHex(r: number, g: number, b: number, a: number) {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}${toHex2(a)}`;
}

function parseHex(hex: string) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  const a = clean.length >= 8 ? parseInt(clean.slice(6, 8), 16) : 255;
  return { r, g, b, a };
}

export default function ColorPicker() {
  const activeColor = useEditorStore((s) => s.activeColor);
  const setActiveColor = useEditorStore((s) => s.setActiveColor);
  const swatches = useEditorStore((s) => s.swatches);
  const addSwatch = useEditorStore((s) => s.addSwatch);

  const { r, g, b, a } = parseHex(activeColor);
  const [h, s, v] = rgbToHsv(r, g, b);
  const [hue, setHue] = useState(h);
  const [sat, setSat] = useState(s);
  const [val, setVal] = useState(v || 1);
  const [alpha, setAlpha] = useState(a);
  const [hexInput, setHexInput] = useState(activeColor);
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const draggingWheel = useRef(false);

  useEffect(() => {
    setHexInput(activeColor);
  }, [activeColor]);

  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cx = WHEEL_SIZE / 2;
    const cy = WHEEL_SIZE / 2;
    const radius = WHEEL_SIZE / 2;
    const imageData = ctx.createImageData(WHEEL_SIZE, WHEEL_SIZE);
    for (let y = 0; y < WHEEL_SIZE; y++) {
      for (let x = 0; x < WHEEL_SIZE; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const o = (y * WHEEL_SIZE + x) * 4;
        if (dist > radius) {
          imageData.data[o + 3] = 0;
          continue;
        }
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        const saturation = Math.min(dist / radius, 1);
        const [rr, gg, bb] = hsvToRgb(angle, saturation, val);
        imageData.data[o] = rr;
        imageData.data[o + 1] = gg;
        imageData.data[o + 2] = bb;
        imageData.data[o + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [val]);

  function commit(nh: number, ns: number, nv: number, na: number) {
    const [rr, gg, bb] = hsvToRgb(nh, ns, nv);
    const hex = rgbaToHex(rr, gg, bb, na);
    setActiveColor(hex);
  }

  function pickFromWheel(clientX: number, clientY: number) {
    const canvas = wheelRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left - WHEEL_SIZE / 2;
    const y = clientY - rect.top - WHEEL_SIZE / 2;
    const radius = WHEEL_SIZE / 2;
    const dist = Math.min(Math.sqrt(x * x + y * y), radius);
    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    const saturation = dist / radius;
    setHue(angle);
    setSat(saturation);
    commit(angle, saturation, val, alpha);
  }

  const knobAngleRad = (hue * Math.PI) / 180;
  const knobDist = sat * (WHEEL_SIZE / 2);
  const knobX = WHEEL_SIZE / 2 + Math.cos(knobAngleRad) * knobDist;
  const knobY = WHEEL_SIZE / 2 + Math.sin(knobAngleRad) * knobDist;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-4">
        <div
          className="relative shrink-0"
          style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        >
          <canvas
            ref={wheelRef}
            width={WHEEL_SIZE}
            height={WHEEL_SIZE}
            className="rounded-full cursor-crosshair"
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              draggingWheel.current = true;
              pickFromWheel(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (draggingWheel.current) pickFromWheel(e.clientX, e.clientY);
            }}
            onPointerUp={() => (draggingWheel.current = false)}
          />
          <div
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-stone-100 pointer-events-none"
            style={{ left: knobX, top: knobY, boxShadow: "0 0 0 1px rgba(0,0,0,.6)" }}
          />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div
            className="h-10 w-full pixel-border"
            style={{
              backgroundColor: activeColor,
              backgroundImage:
                "linear-gradient(45deg, #2a2620 25%, transparent 25%), linear-gradient(-45deg, #2a2620 25%, transparent 25%)",
              backgroundSize: "8px 8px",
            }}
          />
          <label className="flex flex-col gap-1 text-[11px] text-stone-300">
            Brightness
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={val}
              onChange={(e) => {
                const nv = parseFloat(e.target.value);
                setVal(nv);
                commit(hue, sat, nv, alpha);
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px] text-stone-300">
            Alpha
            <input
              type="range"
              min={0}
              max={255}
              step={1}
              value={alpha}
              onChange={(e) => {
                const na = parseInt(e.target.value, 10);
                setAlpha(na);
                commit(hue, sat, val, na);
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] text-stone-300">
            Hex
            <input
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={() => {
                if (/^#?[0-9a-fA-F]{6,8}$/.test(hexInput)) {
                  const hex = hexInput.startsWith("#") ? hexInput : `#${hexInput}`;
                  const padded = hex.length === 7 ? hex + "ff" : hex;
                  setActiveColor(padded);
                  const { r, g, b } = parseHex(padded);
                  const [nh, ns, nv] = rgbToHsv(r, g, b);
                  setHue(nh);
                  setSat(ns);
                  setVal(nv || 1);
                } else {
                  setHexInput(activeColor);
                }
              }}
              className="w-full bg-stone-800 px-2 py-1 pixel-border text-stone-100 outline-none"
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {swatches.map((c) => (
          <button
            key={c}
            onClick={() => setActiveColor(c)}
            className={`h-6 w-6 pixel-border ${c === activeColor ? "ring-2 ring-oak-400" : ""}`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        <button
          onClick={() => addSwatch(activeColor)}
          className="flex h-6 w-6 items-center justify-center pixel-border bg-stone-800 text-stone-300 hover:text-oak-400"
          title="Save current color"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
