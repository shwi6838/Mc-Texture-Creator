import JSZip from "jszip";
import {
  BlockProject,
  FACE_NAMES,
  FaceName,
  BLOCK_FAMILY_VARIANTS,
  TEXTURE_SIZE,
  TextureGrid,
} from "./types";

// Deterministic-ish UUID v4 generator (crypto-backed where available).
function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function textureGridToPngBlob(grid: TextureGrid): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE);
  for (let i = 0; i < grid.length; i++) {
    const hex = grid[i];
    const o = i * 4;
    if (!hex) {
      imageData.data[o] = 0;
      imageData.data[o + 1] = 0;
      imageData.data[o + 2] = 0;
      imageData.data[o + 3] = 0;
      continue;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length >= 9 ? parseInt(hex.slice(7, 9), 16) : 255;
    imageData.data[o] = r;
    imageData.data[o + 1] = g;
    imageData.data[o + 2] = b;
    imageData.data[o + 3] = a;
  }
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

function facesAreIdentical(faces: Record<FaceName, TextureGrid>): boolean {
  const [first, ...rest] = FACE_NAMES.map((f) => faces[f]);
  return rest.every((grid) => grid.every((px, i) => px === first[i]));
}

function textureShortName(identifier: string, face: FaceName, merged: boolean) {
  return merged ? identifier : `${identifier}_${face}`;
}

function buildMaterialInstances(project: BlockProject, merged: boolean) {
  const instances: Record<string, { texture: string; render_method: string }> = {};
  if (merged) {
    instances["*"] = {
      texture: project.identifier,
      render_method: project.renderMethod,
    };
  } else {
    FACE_NAMES.forEach((face) => {
      instances[face] = {
        texture: textureShortName(project.identifier, face, false),
        render_method: project.renderMethod,
      };
    });
  }
  return instances;
}

function buildBlockJson(
  project: BlockProject,
  identifierSuffix: string,
  merged: boolean,
  isBase: boolean,
) {
  const fullIdentifier = `${project.namespace}:${project.identifier}${identifierSuffix}`;
  const components: Record<string, unknown> = {
    "minecraft:material_instances": buildMaterialInstances(project, merged),
    "minecraft:destructible_by_mining": { seconds_to_destroy: project.destroyTime },
    "minecraft:destructible_by_explosion": {
      explosion_resistance: project.explosionResistance,
    },
    "minecraft:map_color": "#a89c8a",
  };
  if (project.lightEmission > 0) {
    components["minecraft:light_emission"] = project.lightEmission;
  }
  if (!isBase) {
    // Shaped variants (stairs/slabs/walls/etc.) need custom geometry.
    // We point at a starter cube geometry the user should refine in Blockbench.
    components["minecraft:geometry"] =
      `geometry.${project.namespace}.${project.identifier}${identifierSuffix}`;
  }

  return {
    format_version: "1.21.0",
    "minecraft:block": {
      description: {
        identifier: fullIdentifier,
        menu_category: { category: "construction" },
      },
      components,
    },
  };
}

function starterCubeGeometry(project: BlockProject, identifierSuffix: string) {
  const geoId = `geometry.${project.namespace}.${project.identifier}${identifierSuffix}`;
  return {
    format_version: "1.21.0",
    "minecraft:geometry": [
      {
        description: {
          identifier: geoId,
          texture_width: TEXTURE_SIZE,
          texture_height: TEXTURE_SIZE,
          visible_bounds_width: 2,
          visible_bounds_height: 2.5,
          visible_bounds_offset: [0, 0.75, 0],
        },
        bones: [
          {
            name: "root",
            pivot: [0, 0, 0],
            cubes: [
              {
                origin: [-8, 0, -8],
                size: [16, 16, 16],
                uv: {
                  north: { uv: [0, 0], uv_size: [16, 16] },
                  south: { uv: [0, 0], uv_size: [16, 16] },
                  east: { uv: [0, 0], uv_size: [16, 16] },
                  west: { uv: [0, 0], uv_size: [16, 16] },
                  up: { uv: [0, 0], uv_size: [16, 16] },
                  down: { uv: [0, 0], uv_size: [16, 16] },
                },
              },
            ],
          },
        ],
      },
    ],
  };
}

export async function buildAddonZip(project: BlockProject): Promise<Blob> {
  const zip = new JSZip();
  const bp = zip.folder("behavior_pack")!;
  const rp = zip.folder("resource_pack")!;

  const bpHeaderUuid = uuid();
  const bpModuleUuid = uuid();
  const rpHeaderUuid = uuid();
  const rpModuleUuid = uuid();

  bp.file(
    "manifest.json",
    JSON.stringify(
      {
        format_version: 2,
        header: {
          name: `${project.displayName} (Behavior Pack)`,
          description: `Adds the ${project.displayName} block.`,
          uuid: bpHeaderUuid,
          version: [1, 0, 0],
          min_engine_version: [1, 21, 0],
        },
        modules: [
          { type: "data", uuid: bpModuleUuid, version: [1, 0, 0] },
        ],
        dependencies: [{ uuid: rpHeaderUuid, version: [1, 0, 0] }],
      },
      null,
      2,
    ),
  );

  rp.file(
    "manifest.json",
    JSON.stringify(
      {
        format_version: 2,
        header: {
          name: `${project.displayName} (Resource Pack)`,
          description: `Textures for the ${project.displayName} block.`,
          uuid: rpHeaderUuid,
          version: [1, 0, 0],
          min_engine_version: [1, 21, 0],
        },
        modules: [
          { type: "resources", uuid: rpModuleUuid, version: [1, 0, 0] },
        ],
        dependencies: [{ uuid: bpHeaderUuid, version: [1, 0, 0] }],
      },
      null,
      2,
    ),
  );

  const merged = facesAreIdentical(project.faces);
  const texturesFolder = rp.folder("textures/blocks")!;
  const textureDataEntries: Record<string, { textures: string }> = {};

  if (merged) {
    const blob = await textureGridToPngBlob(project.faces.up);
    texturesFolder.file(`${project.identifier}.png`, blob);
    textureDataEntries[project.identifier] = {
      textures: `textures/blocks/${project.identifier}`,
    };
  } else {
    for (const face of FACE_NAMES) {
      const blob = await textureGridToPngBlob(project.faces[face]);
      const name = textureShortName(project.identifier, face, false);
      texturesFolder.file(`${name}.png`, blob);
      textureDataEntries[name] = { textures: `textures/blocks/${name}` };
    }
  }

  rp.file(
    "textures/terrain_texture.json",
    JSON.stringify(
      {
        resource_pack_name: project.namespace,
        texture_name: "atlas.terrain",
        padding: 8,
        num_mip_levels: 4,
        texture_data: textureDataEntries,
      },
      null,
      2,
    ),
  );

  // Base block.
  bp.folder("blocks")!.file(
    `${project.identifier}.block.json`,
    JSON.stringify(buildBlockJson(project, "", merged, true), null, 2),
  );

  // Family variants: stub block + starter geometry the user refines in Blockbench.
  const variants = BLOCK_FAMILY_VARIANTS[project.family].filter((v) => v !== "");
  if (variants.length) {
    const geoFolder = rp.folder("models/blocks")!;
    for (const suffix of variants) {
      bp.folder("blocks")!.file(
        `${project.identifier}${suffix}.block.json`,
        JSON.stringify(buildBlockJson(project, suffix, merged, false), null, 2),
      );
      geoFolder.file(
        `${project.identifier}${suffix}.geo.json`,
        JSON.stringify(starterCubeGeometry(project, suffix), null, 2),
      );
    }
  }

  zip.file(
    "README.txt",
    [
      `${project.displayName} — Bedrock add-on`,
      "",
      `Generated by Blockwright. Identifier: ${project.namespace}:${project.identifier}`,
      "",
      "Install: copy the behavior_pack and resource_pack folders into your",
      "com.mojang/development_behavior_packs and development_resource_packs",
      "folders (or zip each and rename to .mcpack), then enable both packs",
      "on a world.",
      variants.length
        ? [
            "",
            `This block uses the "${project.family}" family. Shaped variants`,
            "(stairs/slabs/walls/etc.) were exported with a placeholder full-cube",
            "geometry so the block loads immediately — open the .geo.json files",
            "in Blockbench to sculpt the real stair/slab/wall shape.",
          ].join("\n")
        : "",
    ].join("\n"),
  );

  return zip.generateAsync({ type: "blob" });
}
