import Panel from "@/components/Panel";
import BlockMetaForm from "@/components/BlockMetaForm";
import Toolbar from "@/components/Toolbar";
import PixelCanvas from "@/components/PixelCanvas";
import FaceTabs from "@/components/FaceTabs";
import ColorPicker from "@/components/ColorPicker";
import BlockPreview3D from "@/components/BlockPreview3D";
import AIGeneratePanel from "@/components/AIGeneratePanel";
import ImageSearchPanel from "@/components/ImageSearchPanel";
import SelectionPanel from "@/components/SelectionPanel";
import ExportButton from "@/components/ExportButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-900">
      <header className="flex items-center gap-3 border-b-2 border-stone-950 bg-stone-950 px-5 py-4">
        <div className="h-7 w-7 bg-moss-500 pixel-border" />
        <div>
          <h1 className="font-display text-[13px] leading-none text-stone-100">
            Blockwright
          </h1>
          <p className="mt-1 text-[11px] text-stone-400">
            Paint Bedrock block textures, preview every face, export a ready add-on
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <Panel title="Block">
            <BlockMetaForm />
          </Panel>
          <Panel title="Faces">
            <FaceTabs />
          </Panel>
          <ExportButton />
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Texture editor">
            <div className="flex flex-col items-center gap-4">
              <Toolbar />
              <PixelCanvas />
            </div>
          </Panel>
          <Panel title="Generate with AI">
            <AIGeneratePanel />
          </Panel>
          <Panel title="Texture from photo">
            <ImageSearchPanel />
          </Panel>
          <Panel title="Selection">
            <SelectionPanel />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="Color">
            <ColorPicker />
          </Panel>
          <Panel title="Block preview" className="flex-1">
            <div className="h-64 w-full">
              <BlockPreview3D />
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}
