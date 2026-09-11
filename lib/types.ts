export const TEXTURE_SIZE = 16;
export const PIXEL_COUNT = TEXTURE_SIZE * TEXTURE_SIZE;

// The six faces of a Bedrock block, matching minecraft:material_instances keys.
export const FACE_NAMES = [
  "up",
  "down",
  "north",
  "south",
  "east",
  "west",
] as const;
export type FaceName = (typeof FACE_NAMES)[number];

export const FACE_LABELS: Record<FaceName, string> = {
  up: "Top",
  down: "Bottom",
  north: "North",
  south: "South",
  east: "East",
  west: "West",
};

// RGBA hex string, e.g. "#7cb648ff", or null for a transparent pixel.
export type PixelColor = string | null;

// A single 16x16 texture: a flat array of PIXEL_COUNT colors, row-major from top-left.
export type TextureGrid = PixelColor[];

export type Tool = "pencil" | "fill" | "eyedropper" | "eraser" | "line" | "select";

export interface SelectionRect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const BLOCK_FAMILIES = [
  "none",
  "stairs",
  "slab",
  "wall",
  "fence",
  "fence_gate",
  "button",
  "pressure_plate",
  "door",
  "trapdoor",
] as const;
export type BlockFamily = (typeof BLOCK_FAMILIES)[number];

export const BLOCK_FAMILY_LABELS: Record<BlockFamily, string> = {
  none: "Single block",
  stairs: "Stairs",
  slab: "Slab",
  wall: "Wall",
  fence: "Fence",
  fence_gate: "Fence gate",
  button: "Button",
  pressure_plate: "Pressure plate",
  door: "Door",
  trapdoor: "Trapdoor",
};

// Which variant suffixes a family generates in the add-on export.
export const BLOCK_FAMILY_VARIANTS: Record<BlockFamily, string[]> = {
  none: [""],
  stairs: ["_stairs"],
  slab: ["_slab", "_double_slab"],
  wall: ["_wall"],
  fence: ["_fence"],
  fence_gate: ["_fence_gate"],
  button: ["_button"],
  pressure_plate: ["_pressure_plate"],
  door: ["_door"],
  trapdoor: ["_trapdoor"],
};

export const RENDER_METHODS = [
  "opaque",
  "double_sided",
  "blend",
  "alpha_test",
] as const;
export type RenderMethod = (typeof RENDER_METHODS)[number];

export interface BlockProject {
  identifier: string; // machine name, e.g. "polished_hematite"
  displayName: string; // human name shown in-game and in the UI
  namespace: string; // add-on namespace, e.g. "myaddon"
  linkedFaces: boolean; // when true, editing one face edits all six
  family: BlockFamily;
  renderMethod: RenderMethod;
  lightEmission: number; // 0-15
  destroyTime: number; // hardness, in seconds
  explosionResistance: number;
  faces: Record<FaceName, TextureGrid>;
}

export function blankTexture(fill: PixelColor = null): TextureGrid {
  return new Array(PIXEL_COUNT).fill(fill);
}

export function createDefaultProject(): BlockProject {
  const shared = blankTexture(null);
  const faces = FACE_NAMES.reduce(
    (acc, face) => {
      acc[face] = [...shared];
      return acc;
    },
    {} as Record<FaceName, TextureGrid>,
  );
  return {
    identifier: "custom_block",
    displayName: "Custom Block",
    namespace: "myaddon",
    linkedFaces: true,
    family: "none",
    renderMethod: "opaque",
    lightEmission: 0,
    destroyTime: 1.5,
    explosionResistance: 6,
    faces,
  };
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "custom_block";
}
