export type ThemeId = "dark" | "light" | "cyber" | "retro";

export type ThemePack = {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
};

export const DEFAULT_THEME: ThemeId = "cyber";

export const THEME_PACKS: ThemePack[] = [
  { id: "dark", label: "dark", swatch: ["#0f172a", "#3b82f6", "#8b5cf6"] },
  { id: "light", label: "light", swatch: ["#f8fafc", "#2563eb", "#7c3aed"] },
  { id: "cyber", label: "cyber", swatch: ["#0a0d14", "#3b82f6", "#8b5cf6"] },
  { id: "retro", label: "retro", swatch: ["#13100c", "#ff6b2b", "#00b4c8"] },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_PACKS.some((p) => p.id === value);
}
