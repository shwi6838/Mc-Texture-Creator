"use client";

import { useEditorStore } from "@/lib/store";
import {
  BLOCK_FAMILIES,
  BLOCK_FAMILY_LABELS,
  BLOCK_FAMILY_PRESETS,
  FamilyPresetKey,
  RENDER_METHODS,
} from "@/lib/types";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-stone-400">
      {label}
      {children}
    </label>
  );
}

const inputClass =
  "bg-stone-800 px-2 py-1.5 pixel-border text-sm text-stone-100 outline-none normal-case focus:bg-stone-700";

export default function BlockMetaForm() {
  const project = useEditorStore((s) => s.project);
  const setIdentifier = useEditorStore((s) => s.setIdentifier);
  const setDisplayName = useEditorStore((s) => s.setDisplayName);
  const setNamespace = useEditorStore((s) => s.setNamespace);
  const toggleFamily = useEditorStore((s) => s.toggleFamily);
  const applyFamilyPreset = useEditorStore((s) => s.applyFamilyPreset);
  const clearFamilies = useEditorStore((s) => s.clearFamilies);
  const setRenderMethod = useEditorStore((s) => s.setRenderMethod);
  const setLightEmission = useEditorStore((s) => s.setLightEmission);
  const setDestroyTime = useEditorStore((s) => s.setDestroyTime);
  const setExplosionResistance = useEditorStore((s) => s.setExplosionResistance);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Display name">
        <input
          className={inputClass}
          value={project.displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Polished Hematite"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Namespace">
          <input
            className={inputClass}
            value={project.namespace}
            onChange={(e) => setNamespace(e.target.value)}
            placeholder="myaddon"
          />
        </Field>
        <Field label="Identifier">
          <input
            className={inputClass}
            value={project.identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="polished_hematite"
          />
        </Field>
      </div>
      <p className="-mt-1 text-[11px] text-stone-500">
        Full ID: {project.namespace}:{project.identifier}
      </p>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>Block family</span>
          {project.families.length > 0 && (
            <button
              type="button"
              onClick={clearFamilies}
              className="text-stone-500 underline-offset-2 hover:text-stone-300 hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(BLOCK_FAMILY_PRESETS) as FamilyPresetKey[]).map((key) => {
            const preset = BLOCK_FAMILY_PRESETS[key];
            const active =
              preset.families.length === project.families.length &&
              preset.families.every((f) => project.families.includes(f));
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyFamilyPreset(key)}
                className={`pixel-border px-2 py-1.5 text-[11px] ${
                  active
                    ? "bg-moss-500 text-stone-950"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-stone-500">
          A block can belong to several families at once — toggle any of these on. A preset
          toggles its whole set and matches Minecraft's hardness/blast resistance for that
          material.
        </p>

        <div className="flex flex-wrap gap-1.5">
          {BLOCK_FAMILIES.map((f) => {
            const active = project.families.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFamily(f)}
                aria-pressed={active}
                className={`pixel-border px-2 py-1 text-[11px] ${
                  active
                    ? "bg-moss-500 text-stone-950"
                    : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {BLOCK_FAMILY_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Render method">
        <select
          className={inputClass}
          value={project.renderMethod}
          onChange={(e) => setRenderMethod(e.target.value as (typeof RENDER_METHODS)[number])}
        >
          {RENDER_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Hardness">
          <input
            type="number"
            step={0.1}
            min={0}
            className={inputClass}
            value={project.destroyTime}
            onChange={(e) => setDestroyTime(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Blast res.">
          <input
            type="number"
            step={0.5}
            min={0}
            className={inputClass}
            value={project.explosionResistance}
            onChange={(e) => setExplosionResistance(parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Light">
          <input
            type="number"
            step={1}
            min={0}
            max={15}
            className={inputClass}
            value={project.lightEmission}
            onChange={(e) => setLightEmission(parseInt(e.target.value, 10) || 0)}
          />
        </Field>
      </div>
    </div>
  );
}