"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { saveAs } from "file-saver";
import { useEditorStore } from "@/lib/store";
import { buildAddonZip } from "@/lib/export";

export default function ExportButton() {
  const project = useEditorStore((s) => s.project);
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const blob = await buildAddonZip(project);
      saveAs(blob, `${project.identifier || "block"}_addon.zip`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 bg-moss-600 px-3 py-2.5 pixel-border text-sm font-medium text-stone-950 hover:bg-moss-500 disabled:opacity-50"
    >
      {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      Export add-on (.zip)
    </button>
  );
}
