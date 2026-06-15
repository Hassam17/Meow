// Theme pack metadata — picker labels and swatches only. The actual tokens
// are plain CSS blocks in styles/globals.css keyed by [data-palette="…"]
// (no attribute = ember, the original warm palette). Every pack defines the
// full token set for both dark and light modes.

export type PaletteId = "ember" | "slate" | "moss" | "plum" | "ash" | "sand" | "ink";

export type ThemePack = {
  id: PaletteId;
  label: string;
  /** [card bg, primary accent, secondary accent] — drawn in the picker */
  swatch: [string, string, string];
};

export const DEFAULT_PALETTE: PaletteId = "ember";

export const THEME_PACKS: ThemePack[] = [
  { id: "ember", label: "ember", swatch: ["#1e1a14", "#ff6b2b", "#00b4c8"] },
  { id: "slate", label: "slate", swatch: ["#161b22", "#4da3ff", "#00c8a0"] },
  { id: "moss", label: "moss", swatch: ["#141c14", "#8fc63c", "#d89a28"] },
  { id: "plum", label: "plum", swatch: ["#1c141e", "#e84a8a", "#d8a830"] },
  { id: "ash", label: "ash", swatch: ["#171717", "#f2f2f2", "#9ca3af"] },
  { id: "sand", label: "sand", swatch: ["#f3efe6", "#2f2a24", "#8b7d6b"] },
  { id: "ink", label: "ink", swatch: ["#101418", "#dce7f3", "#6f879d"] },
];

export function isPaletteId(value: unknown): value is PaletteId {
  return THEME_PACKS.some((p) => p.id === value);
}
