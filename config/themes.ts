export type ThemeId = "cyber" | "fifa" | "mission-control" | "glass" | "retro";

export type ThemePack = {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
};

export const DEFAULT_THEME: ThemeId = "cyber";

export const THEME_PACKS: ThemePack[] = [
  { id: "cyber", label: "Cyber", swatch: ["#0a0d14", "#3b82f6", "#8b5cf6"] },
  { id: "fifa", label: "FIFA Ultimate Team", swatch: ["#071b14", "#22c55e", "#eab308"] },
  { id: "mission-control", label: "Mission Control", swatch: ["#0c1220", "#60a5fa", "#94a3b8"] },
  { id: "glass", label: "Glass", swatch: ["#e8eef8", "#38bdf8", "#a855f7"] },
  { id: "retro", label: "Retro", swatch: ["#13100c", "#ff6b2b", "#00b4c8"] },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEME_PACKS.some((p) => p.id === value);
}
