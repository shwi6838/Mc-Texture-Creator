"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { RotateCcw } from "lucide-react";
import * as THREE from "three";
import { useEditorStore } from "@/lib/store";
import { FaceName, TEXTURE_SIZE, TextureGrid } from "@/lib/types";


function gridToCanvas(grid: TextureGrid): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
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
  return canvas;
}

function useFaceTexture(grid: TextureGrid) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  return useMemo(() => {
    const canvas = gridToCanvas(grid);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    textureRef.current = tex;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);
}

// three.js BoxGeometry material order: [+x, -x, +y, -y, +z, -z]
// Minecraft axes: +x=east -x=west +y=up -y=down +z=south -z=north
const MATERIAL_ORDER: FaceName[] = ["east", "west", "up", "down", "south", "north"];

function Cube() {
  const project = useEditorStore((s) => s.project);
  const textures = MATERIAL_ORDER.map((face) => useFaceTexture(project.faces[face]));

  return (
    <mesh rotation={[0.5, 0.8, 0]}>
      <boxGeometry args={[1.6, 1.6, 1.6]} />
      {textures.map((tex, i) => (
        <meshStandardMaterial
          key={MATERIAL_ORDER[i]}
          attach={`material-${i}`}
          map={tex}
          transparent
          roughness={0.9}
          metalness={0}
        />
      ))}
    </mesh>
  );
}

export default function BlockPreview3D() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  return (
    <div className="relative h-full w-full pixel-border checker-bg">
      <button
        type="button"
        onClick={() => controlsRef.current?.reset()}
        title="Reset view"
        aria-label="Reset view"
        className="absolute right-2 top-2 z-10 flex items-center gap-1 bg-stone-950/80 px-2 py-1 pixel-border text-[10px] text-stone-300 hover:text-stone-100 hover:bg-stone-800"
      >
        <RotateCcw className="h-3 w-3" />
        Reset
      </button>
      <Canvas camera={{ position: [2.4, 2, 2.6], fov: 35 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <directionalLight position={[-3, -2, -2]} intensity={0.3} />
        <Cube />
        <OrbitControls ref={controlsRef} enablePan={false} minDistance={2} maxDistance={6} />
      </Canvas>
    </div>
  );
}
