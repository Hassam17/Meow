export type ThemeId =
  | "cyber"
  | "retro"
  | "glass"
  | "football-manager"
  | "mission-control"
  | "minimal";

export type ThemeSource = "builtin" | "custom";

export type ThemeTokenName =
  | "--bg-page"
  | "--bg-card"
  | "--bg-nested"
  | "--border"
  | "--shadow"
  | "--text-primary"
  | "--text-muted"
  | "--text-muted-dim"
  | "--accent-orange"
  | "--accent-cyan"
  | "--accent-warm"
  | "--badge-text"
  | "--status-up"
  | "--status-down"
  | "--color-card-soft"
  | "--color-text"
  | "--color-text-muted"
  | "--color-text-dim";

export type ThemeTokens = Record<ThemeTokenName, string>;

export type ThemeDefinition = {
  id: string;
  label: string;
  swatch: [string, string, string];
  tokens: ThemeTokens;
  description?: string;
  source?: ThemeSource;
};

export type ThemePack = Pick<ThemeDefinition, "id" | "label" | "swatch">;

export const DEFAULT_THEME: ThemeId = "cyber";

export const THEME_TOKEN_KEYS: readonly ThemeTokenName[] = [
  "--bg-page",
  "--bg-card",
  "--bg-nested",
  "--border",
  "--shadow",
  "--text-primary",
  "--text-muted",
  "--text-muted-dim",
  "--accent-orange",
  "--accent-cyan",
  "--accent-warm",
  "--badge-text",
  "--status-up",
  "--status-down",
  "--color-card-soft",
  "--color-text",
  "--color-text-muted",
  "--color-text-dim",
] as const;

const baseTokens = {
  "--color-card-soft": "rgba(18, 23, 34, 0.8)",
  "--color-text": "#e5e7eb",
  "--color-text-muted": "#94a3b8",
  "--color-text-dim": "#64748b",
} satisfies Pick<ThemeTokens, "--color-card-soft" | "--color-text" | "--color-text-muted" | "--color-text-dim">;

function makeTheme(theme: Omit<ThemeDefinition, "source">): ThemeDefinition {
  return { ...theme, source: "builtin" };
}

export const BUILTIN_THEMES: ThemeDefinition[] = [
  makeTheme({
    id: "cyber",
    label: "Cyber",
    swatch: ["#0a0d14", "#3b82f6", "#8b5cf6"],
    description: "Dark dashboard glass with blue and violet accents.",
    tokens: {
      ...baseTokens,
      "--bg-page": "#0a0d14",
      "--bg-card": "#121722",
      "--bg-nested": "#0f1420",
      "--border": "rgba(255,255,255,0.08)",
      "--shadow": "#02040a",
      "--text-primary": "#e5e7eb",
      "--text-muted": "#94a3b8",
      "--text-muted-dim": "#64748b",
      "--accent-orange": "#3b82f6",
      "--accent-cyan": "#8b5cf6",
      "--accent-warm": "#cbd5e1",
      "--badge-text": "#0a0d14",
      "--status-up": "#22c55e",
      "--status-down": "#ef4444",
    },
  }),
  makeTheme({
    id: "retro",
    label: "Retro",
    swatch: ["#13100c", "#ff6b2b", "#00b4c8"],
    description: "Warm monochrome with arcade orange and cyan accents.",
    tokens: {
      ...baseTokens,
      "--bg-page": "#13100c",
      "--bg-card": "#1e1a14",
      "--bg-nested": "#1a1610",
      "--border": "#3d3220",
      "--shadow": "#070604",
      "--text-primary": "#e8dfc8",
      "--text-muted": "#9d947f",
      "--text-muted-dim": "#6f6555",
      "--accent-orange": "#ff6b2b",
      "--accent-cyan": "#00b4c8",
      "--accent-warm": "#e8dfc8",
      "--badge-text": "#13100c",
      "--status-up": "#1c6b30",
      "--status-down": "#c84a12",
    },
  }),
  makeTheme({
    id: "glass",
    label: "Glass",
    swatch: ["#e8eef8", "#38bdf8", "#a855f7"],
    description: "Bright translucent surfaces with airy contrast.",
    tokens: {
      ...baseTokens,
      "--bg-page": "#eef4fb",
      "--bg-card": "rgba(255,255,255,0.72)",
      "--bg-nested": "rgba(241,245,249,0.9)",
      "--border": "rgba(148,163,184,0.28)",
      "--shadow": "rgba(15,23,42,0.15)",
      "--text-primary": "#0f172a",
      "--text-muted": "#475569",
      "--text-muted-dim": "#64748b",
      "--accent-orange": "#38bdf8",
      "--accent-cyan": "#a855f7",
      "--accent-warm": "#0f172a",
      "--badge-text": "#ffffff",
      "--status-up": "#16a34a",
      "--status-down": "#dc2626",
    },
  }),
  makeTheme({
    id: "football-manager",
    label: "Football Manager",
    swatch: ["#06140e", "#22c55e", "#eab308"],
    description: "Pitch green with tactical gold and dark locker-room surfaces.",
    tokens: {
      ...baseTokens,
      "--bg-page": "#06140e",
      "--bg-card": "#0f1c16",
      "--bg-nested": "#0c1712",
      "--border": "rgba(34,197,94,0.18)",
      "--shadow": "#030705",
      "--text-primary": "#e7f6ea",
      "--text-muted": "#92b6a0",
      "--text-muted-dim": "#5e7b69",
      "--accent-orange": "#22c55e",
      "--accent-cyan": "#eab308",
      "--accent-warm": "#dff7e3",
      "--badge-text": "#06140e",
      "--status-up": "#4ade80",
      "--status-down": "#f97316",
    },
  }),
  makeTheme({
    id: "mission-control",
    label: "Mission Control",
    swatch: ["#0c1220", "#60a5fa", "#94a3b8"],
    description: "Steely operational dashboard with crisp blue telemetry.",
    tokens: {
      ...baseTokens,
      "--bg-page": "#0c1220",
      "--bg-card": "#121a2c",
      "--bg-nested": "#0f1627",
      "--border": "rgba(148,163,184,0.16)",
      "--shadow": "#04070d",
      "--text-primary": "#e5e7eb",
      "--text-muted": "#94a3b8",
      "--text-muted-dim": "#64748b",
      "--accent-orange": "#60a5fa",
      "--accent-cyan": "#94a3b8",
      "--accent-warm": "#f8fafc",
      "--badge-text": "#0c1220",
      "--status-up": "#38bdf8",
      "--status-down": "#fb7185",
    },
  }),
  makeTheme({
    id: "minimal",
    label: "Minimal",
    swatch: ["#f4f6f8", "#94a3b8", "#111827"],
    description: "Low-noise neutrals with restrained contrast.",
    tokens: {
      ...baseTokens,
      "--bg-page": "#f4f6f8",
      "--bg-card": "#ffffff",
      "--bg-nested": "#eef2f6",
      "--border": "rgba(15,23,42,0.12)",
      "--shadow": "rgba(15,23,42,0.08)",
      "--text-primary": "#111827",
      "--text-muted": "#475569",
      "--text-muted-dim": "#64748b",
      "--accent-orange": "#111827",
      "--accent-cyan": "#64748b",
      "--accent-warm": "#111827",
      "--badge-text": "#ffffff",
      "--status-up": "#16a34a",
      "--status-down": "#dc2626",
    },
  }),
];

export const THEME_PACKS: ThemePack[] = BUILTIN_THEMES.map(({ id, label, swatch }) => ({ id, label, swatch }));

const BUILTIN_THEME_IDS = new Set(BUILTIN_THEMES.map((theme) => theme.id));

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && BUILTIN_THEME_IDS.has(value);
}

export function normalizeThemeId(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  if (value === "fifa") return "football-manager";
  if (isThemeId(value)) return value;
  return value;
}

export function getThemeById(id: string): ThemeDefinition | undefined {
  return BUILTIN_THEMES.find((theme) => theme.id === id);
}
