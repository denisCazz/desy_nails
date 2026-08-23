"use client";

import { useState } from "react";

const DEFAULT_COLORS = ["#f3d5cc", "#e8c4b8", "#f7e4dc", "#e2b7aa", "#f0d0c6"];

function toHex6(color: string) {
  const value = color.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    const r = value[1];
    const g = value[2];
    const b = value[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return "#f3d5cc";
}

export function ColorPickerList({
  name = "colors",
  defaultColors,
}: {
  name?: string;
  defaultColors?: string[];
}) {
  const initial = (defaultColors ?? []).map(toHex6).filter(Boolean);
  const [colors, setColors] = useState(initial.length > 0 ? initial : DEFAULT_COLORS);

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={colors.join(", ")} />
      <p className="text-sm text-muted">Colori del set</p>
      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color, index) => (
          <label key={`${index}-${color}`} className="flex items-center gap-1">
            <input
              type="color"
              value={color}
              aria-label={`Colore ${index + 1}`}
              onChange={(event) => {
                const next = event.target.value;
                setColors((current) => current.map((item, i) => (i === index ? next : item)));
              }}
              className="h-10 w-10 cursor-pointer rounded-lg border border-line bg-paper p-0.5"
            />
            {colors.length > 1 ? (
              <button
                type="button"
                aria-label={`Rimuovi colore ${index + 1}`}
                onClick={() => setColors((current) => current.filter((_, i) => i !== index))}
                className="text-sm text-rose"
              >
                ×
              </button>
            ) : null}
          </label>
        ))}
        <button
          type="button"
          onClick={() => setColors((current) => [...current, "#f3d5cc"])}
          className="rounded-full border border-line px-3 py-1 text-xs"
        >
          + Colore
        </button>
      </div>
    </div>
  );
}
