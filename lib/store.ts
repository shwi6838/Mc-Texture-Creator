import { create } from "zustand";
import {
  BlockFamily,
  BlockProject,
  FACE_NAMES,
  FaceName,
  PixelColor,
  RenderMethod,
  SelectionRect,
  TEXTURE_SIZE,
  TextureGrid,
  Tool,
  createDefaultProject,
  slugify,
} from "./types";

interface HistoryEntry {
  face: FaceName;
  grid: TextureGrid;
}

interface EditorState {
  project: BlockProject;
  activeFace: FaceName;
  tool: Tool;
  activeColor: string;
  swatches: string[];
  past: HistoryEntry[];
  future: HistoryEntry[];
  isGenerating: boolean;
  selection: SelectionRect | null;
  selectionBaseline: TextureGrid | null;

  setIdentifier: (v: string) => void;
  setDisplayName: (v: string) => void;
  setNamespace: (v: string) => void;
  setFamily: (v: BlockFamily) => void;
  setRenderMethod: (v: RenderMethod) => void;
  setLightEmission: (v: number) => void;
  setDestroyTime: (v: number) => void;
  setExplosionResistance: (v: number) => void;
  toggleLinkedFaces: () => void;
  setActiveFace: (f: FaceName) => void;
  setTool: (t: EditorState["tool"]) => void;
  setActiveColor: (c: string) => void;
  addSwatch: (c: string) => void;

  paintPixel: (index: number) => void;
  erasePixel: (index: number) => void;
  eyedrop: (index: number) => void;
  floodFill: (index: number) => void;
  clearActiveFace: () => void;
  setFaceGrid: (face: FaceName, grid: TextureGrid) => void;
  undo: () => void;
  redo: () => void;
  setGenerating: (v: boolean) => void;
  resetProject: () => void;

  setSelection: (rect: SelectionRect) => void;
  clearSelection: () => void;
  previewSelectionAdjust: (brightness: number, alpha: number) => void;
  commitSelectionAdjust: () => void;
  fillSelection: () => void;
}

const MAX_HISTORY = 60;

function snapshot(state: EditorState): HistoryEntry {
  return { face: state.activeFace, grid: [...state.project.faces[state.activeFace]] };
}

function withHistory(
  set: (fn: (s: EditorState) => Partial<EditorState>) => void,
  get: () => EditorState,
) {
  return (mutator: (grid: TextureGrid) => TextureGrid, face?: FaceName) => {
    const state = get();
    const targetFaces = state.project.linkedFaces ? FACE_NAMES : [face ?? state.activeFace];
    const entry = snapshot(state);
    set((s) => {
      const newFaces = { ...s.project.faces };
      targetFaces.forEach((f) => {
        newFaces[f] = mutator(newFaces[f]);
      });
      const past = [...s.past, entry].slice(-MAX_HISTORY);
      return {
        project: { ...s.project, faces: newFaces },
        past,
        future: [],
      };
    });
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  project: createDefaultProject(),
  activeFace: "north",
  tool: "pencil",
  activeColor: "#7cb648ff",
  swatches: [
    "#7cb648ff",
    "#c9975a ".trim() + "ff",
    "#b3402aff",
    "#4c76b8ff",
    "#ece5d8ff",
    "#26221dff",
    "#5c5346ff",
    "#dcb27eff",
  ],
  past: [],
  future: [],
  isGenerating: false,
  selection: null,
  selectionBaseline: null,

  setIdentifier: (v) =>
    set((s) => ({ project: { ...s.project, identifier: slugify(v) } })),
  setDisplayName: (v) => set((s) => ({ project: { ...s.project, displayName: v } })),
  setNamespace: (v) =>
    set((s) => ({ project: { ...s.project, namespace: slugify(v) } })),
  setFamily: (v) => set((s) => ({ project: { ...s.project, family: v } })),
  setRenderMethod: (v) => set((s) => ({ project: { ...s.project, renderMethod: v } })),
  setLightEmission: (v) => set((s) => ({ project: { ...s.project, lightEmission: v } })),
  setDestroyTime: (v) => set((s) => ({ project: { ...s.project, destroyTime: v } })),
  setExplosionResistance: (v) =>
    set((s) => ({ project: { ...s.project, explosionResistance: v } })),
  toggleLinkedFaces: () =>
    set((s) => ({ project: { ...s.project, linkedFaces: !s.project.linkedFaces } })),
  setActiveFace: (f) => set({ activeFace: f, selection: null, selectionBaseline: null }),
  setTool: (t) => set({ tool: t }),
  setActiveColor: (c) => set({ activeColor: c }),
  addSwatch: (c) =>
    set((s) => ({
      swatches: s.swatches.includes(c) ? s.swatches : [c, ...s.swatches].slice(0, 16),
    })),

  paintPixel: (index) => {
    const apply = withHistory(set, get);
    const { activeColor } = get();
    apply((grid) => {
      const next = [...grid];
      next[index] = activeColor;
      return next;
    });
  },

  erasePixel: (index) => {
    const apply = withHistory(set, get);
    apply((grid) => {
      const next = [...grid];
      next[index] = null;
      return next;
    });
  },

  eyedrop: (index) => {
    const { project, activeFace } = get();
    const color = project.faces[activeFace][index];
    if (color) {
      set({ activeColor: color, tool: "pencil" });
      get().addSwatch(color);
    }
  },

  floodFill: (index) => {
    const apply = withHistory(set, get);
    const { activeColor, project, activeFace } = get();
    const source = project.faces[activeFace];
    const target = source[index];
    if (target === activeColor) return;
    apply((grid) => {
      const next = [...grid];
      const visited = new Set<number>();
      const stack = [index];
      const w = TEXTURE_SIZE;
      while (stack.length) {
        const i = stack.pop()!;
        if (visited.has(i)) continue;
        if (next[i] !== target) continue;
        visited.add(i);
        next[i] = activeColor;
        const x = i % w;
        const y = Math.floor(i / w);
        if (x > 0) stack.push(i - 1);
        if (x < w - 1) stack.push(i + 1);
        if (y > 0) stack.push(i - w);
        if (y < w - 1) stack.push(i + w);
      }
      return next;
    });
  },

  clearActiveFace: () => {
    const apply = withHistory(set, get);
    apply((grid) => grid.map(() => null));
  },

  setFaceGrid: (face, grid) => {
    const entry = snapshot(get());
    set((s) => {
      const targetFaces = s.project.linkedFaces ? FACE_NAMES : [face];
      const newFaces = { ...s.project.faces };
      targetFaces.forEach((f) => {
        newFaces[f] = [...grid];
      });
      return {
        project: { ...s.project, faces: newFaces },
        past: [...s.past, entry].slice(-MAX_HISTORY),
        future: [],
      };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;
    const last = past[past.length - 1];
    set((s) => {
      const current = { face: last.face, grid: [...s.project.faces[last.face]] };
      const newFaces = { ...s.project.faces, [last.face]: last.grid };
      return {
        project: { ...s.project, faces: newFaces },
        past: past.slice(0, -1),
        future: [...s.future, current].slice(-MAX_HISTORY),
        activeFace: last.face,
      };
    });
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;
    const last = future[future.length - 1];
    set((s) => {
      const current = { face: last.face, grid: [...s.project.faces[last.face]] };
      const newFaces = { ...s.project.faces, [last.face]: last.grid };
      return {
        project: { ...s.project, faces: newFaces },
        future: future.slice(0, -1),
        past: [...s.past, current].slice(-MAX_HISTORY),
        activeFace: last.face,
      };
    });
  },

  setGenerating: (v) => set({ isGenerating: v }),

  resetProject: () => set({ project: createDefaultProject(), past: [], future: [] }),

  setSelection: (rect) => {
    const { activeFace, project } = get();
    set({ selection: rect, selectionBaseline: [...project.faces[activeFace]] });
  },

  clearSelection: () => set({ selection: null, selectionBaseline: null }),

  // Live preview while dragging a brightness/alpha slider: recomputes from the
  // baseline captured when the selection was made, so repeated drags don't
  // compound, and does NOT touch undo history (that happens on commit).
  previewSelectionAdjust: (brightness, alpha) => {
    const { selection, selectionBaseline, project, activeFace } = get();
    if (!selection || !selectionBaseline) return;
    const targetFaces = project.linkedFaces ? FACE_NAMES : [activeFace];
    const brightnessFactor = 1 + brightness / 100;
    const alphaDelta = (alpha / 100) * 255;

    const newGrid = selectionBaseline.map((hex, i) => {
      if (!inSelection(i, selection) || !hex) return hex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255;
      const nr = clamp255(r * brightnessFactor);
      const ng = clamp255(g * brightnessFactor);
      const nb = clamp255(b * brightnessFactor);
      const na = clamp255(a + alphaDelta);
      return `#${toHex2(nr)}${toHex2(ng)}${toHex2(nb)}${toHex2(na)}`;
    });

    set((s) => {
      const newFaces = { ...s.project.faces };
      targetFaces.forEach((f) => {
        newFaces[f] = newGrid;
      });
      return { project: { ...s.project, faces: newFaces } };
    });
  },

  // Called when the user releases a brightness/alpha slider: turns the
  // already-applied preview into a single undo step, and re-baselines so
  // the next adjustment stacks predictably on top of this one.
  commitSelectionAdjust: () => {
    const { selectionBaseline, activeFace, project } = get();
    if (!selectionBaseline) return;
    const entry: HistoryEntry = { face: activeFace, grid: selectionBaseline };
    set((s) => ({
      past: [...s.past, entry].slice(-MAX_HISTORY),
      future: [],
      selectionBaseline: [...s.project.faces[activeFace]],
    }));
  },

  fillSelection: () => {
    const { selection, activeColor, project, activeFace } = get();
    if (!selection) return;
    const targetFaces = project.linkedFaces ? FACE_NAMES : [activeFace];
    const entry: HistoryEntry = { face: activeFace, grid: [...project.faces[activeFace]] };
    set((s) => {
      const newFaces = { ...s.project.faces };
      targetFaces.forEach((f) => {
        newFaces[f] = newFaces[f].map((hex, i) => (inSelection(i, selection) ? activeColor : hex));
      });
      return {
        project: { ...s.project, faces: newFaces },
        past: [...s.past, entry].slice(-MAX_HISTORY),
        future: [],
        selectionBaseline: newFaces[s.activeFace],
      };
    });
  },
}));

function inSelection(index: number, rect: SelectionRect): boolean {
  const x = index % TEXTURE_SIZE;
  const y = Math.floor(index / TEXTURE_SIZE);
  return x >= rect.minX && x <= rect.maxX && y >= rect.minY && y <= rect.maxY;
}

function clamp255(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHex2(n: number): string {
  return n.toString(16).padStart(2, "0");
}
