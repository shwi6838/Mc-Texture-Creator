"use client";

import {
  Pencil,
  PaintBucket,
  Pipette,
  Eraser,
  Slash,
  BoxSelect,
  Undo2,
  Redo2,
  Trash2,
  Link2,
  Link2Off,
  X,
} from "lucide-react";
import { useEditorStore } from "@/lib/store";
import { Tool } from "@/lib/types";

const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
  { id: "pencil", label: "Paintbrush", icon: <Pencil size={16} /> },
  { id: "fill", label: "Fill", icon: <PaintBucket size={16} /> },
  { id: "line", label: "Line", icon: <Slash size={16} /> },
  { id: "select", label: "Select", icon: <BoxSelect size={16} /> },
  { id: "eyedropper", label: "Eyedropper", icon: <Pipette size={16} /> },
  { id: "eraser", label: "Eraser", icon: <Eraser size={16} /> },
];

export default function Toolbar() {
  const tool = useEditorStore((s) => s.tool);
  const setTool = useEditorStore((s) => s.setTool);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const clearActiveFace = useEditorStore((s) => s.clearActiveFace);
  const linkedFaces = useEditorStore((s) => s.project.linkedFaces);
  const toggleLinkedFaces = useEditorStore((s) => s.toggleLinkedFaces);
  const past = useEditorStore((s) => s.past.length);
  const future = useEditorStore((s) => s.future.length);
  const selection = useEditorStore((s) => s.selection);
  const clearSelection = useEditorStore((s) => s.clearSelection);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTool(t.id)}
          title={t.label}
          className={`flex h-9 w-9 items-center justify-center pixel-border transition-colors ${
            tool === t.id
              ? "bg-oak-500 text-stone-950"
              : "bg-stone-800 text-stone-200 hover:bg-stone-700"
          }`}
        >
          {t.icon}
        </button>
      ))}

      {selection && (
        <button
          onClick={clearSelection}
          title="Clear selection (Esc)"
          className="flex h-9 w-9 items-center justify-center pixel-border bg-lapis-500 text-stone-100 hover:bg-lapis-400"
        >
          <X size={16} />
        </button>
      )}

      <div className="mx-1 h-6 w-px bg-stone-700" />

      <button
        onClick={undo}
        disabled={past === 0}
        title="Undo"
        className="flex h-9 w-9 items-center justify-center pixel-border bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:opacity-30"
      >
        <Undo2 size={16} />
      </button>
      <button
        onClick={redo}
        disabled={future === 0}
        title="Redo"
        className="flex h-9 w-9 items-center justify-center pixel-border bg-stone-800 text-stone-200 hover:bg-stone-700 disabled:opacity-30"
      >
        <Redo2 size={16} />
      </button>
      <button
        onClick={clearActiveFace}
        title="Clear this face"
        className="flex h-9 w-9 items-center justify-center pixel-border bg-stone-800 text-stone-200 hover:bg-redstone-500"
      >
        <Trash2 size={16} />
      </button>

      <div className="mx-1 h-6 w-px bg-stone-700" />

      <button
        onClick={toggleLinkedFaces}
        title={linkedFaces ? "All faces linked — click to unlink" : "Faces unlinked — click to link"}
        className={`flex h-9 items-center gap-1.5 px-3 pixel-border text-[11px] ${
          linkedFaces ? "bg-moss-600 text-stone-950" : "bg-stone-800 text-stone-200"
        }`}
      >
        {linkedFaces ? <Link2 size={14} /> : <Link2Off size={14} />}
        {linkedFaces ? "Linked" : "Per-face"}
      </button>
    </div>
  );
}