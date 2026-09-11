# Blockwright — Bedrock Texture Studio

A Next.js app for designing Minecraft: Bedrock Edition block textures: paint a 16×16 texture
per face, preview the block in 3D, name it, assign it to a block family (stairs/slab/wall/
fence/etc.), and export a working resource + behavior pack add-on.

## Features

- **16×16 pixel editor** — paintbrush, fill bucket, line tool, eyedropper, eraser, undo/redo.
- **Color picker** — HSV color wheel, brightness and alpha sliders, hex input, saved swatches.
- **Six-face editing** — edit north/south/east/west/up/down independently, or link them so one
  edit updates every face (handy for a block that looks the same on all sides).
- **Live 3D preview** — an orbitable cube using the textures you just painted, mapped to
  Minecraft's actual face conventions (+x=east, -x=west, +y=up, -y=down, +z=south, -z=north).
- **Block identity** — display name, namespace, identifier, render method, hardness, blast
  resistance, light emission.
- **Block families** — tag a block as a stairs/slab/wall/fence/fence gate/button/pressure
  plate/door/trapdoor variant set. Export generates one `.block.json` per variant plus a
  starter full-cube geometry stub for each shaped variant — open those `.geo.json` files in
  Blockbench to sculpt the real stair/slab/wall shape (Bedrock has no automatic "block family"
  shape generator the way Java's block-family JSON does, so this scaffolds the files and leaves
  the geometry to you).
- **AI texture generation** — describe a texture in words and Claude fills in the 256 pixels
  for the active face.
- **Export** — a `.zip` containing a paired behavior_pack + resource_pack (manifests,
  `blocks/*.block.json` using `minecraft:material_instances`, `textures/terrain_texture.json`,
  and the PNGs), ready to drop into `com.mojang/development_behavior_packs` and
  `development_resource_packs`.

Format is modeled on the samples in
[Mojang/bedrock-samples](https://github.com/Mojang/bedrock-samples) and validated against
[Mojang/bedrock-schemas](https://github.com/Mojang/bedrock-schemas); double-check against those
repos if you're targeting a specific engine version, since Mojang updates the schema with every
Bedrock release.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### AI texture generation (optional)

The "Generate with AI" panel calls Claude from a server route, so your API key never reaches
the browser. Copy `.env.example` to `.env.local` and add your key:

```bash
cp .env.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY
```

Without a key, everything else in the app works — you just won't be able to use that one panel.

## Using the exported add-on

1. Click **Export add-on (.zip)**.
2. Unzip it; you'll get `behavior_pack/` and `resource_pack/` folders.
3. Copy each into `com.mojang/development_behavior_packs/<name>` and
   `com.mojang/development_resource_packs/<name>` (or zip each folder individually and rename
   to `.mcpack` to double-click install).
4. In-game, create or edit a world, enable both packs, and turn on **Experimental: Holiday
   Creator Features** if your Bedrock version requires it for custom blocks.
5. Get the block with `/give @s <namespace>:<identifier>`.

## Tech

Next.js (App Router) + TypeScript, Tailwind CSS, Zustand for editor state, `@react-three/fiber`
for the 3D preview, JSZip + FileSaver for export, Lucide for icons.
