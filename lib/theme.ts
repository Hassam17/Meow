import {
  BUILTIN_THEMES,
  DEFAULT_THEME,
  getThemeById,
  normalizeThemeId,
  type ThemeDefinition,
  type ThemeId,
  type ThemeTokens,
} from "@/config/themes";

const ACTIVE_THEME_KEY = "nutmag-theme";
const THEME_LIBRARY_KEY = "nutmag-theme-catalog";

let previewThemeId: string | null = null;
let themeLibraryCache: ThemeDefinition[] | null = null;
const listeners = new Set<() => void>();

export type ThemeMode = string;

function copyTheme(theme: ThemeDefinition): ThemeDefinition {
  return {
    ...theme,
    tokens: { ...theme.tokens },
    swatch: [...theme.swatch] as [string, string, string],
  };
}

function readStoredThemeId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_THEME_KEY);
  } catch {
    return null;
  }
}

function readStoredLibrary(): ThemeDefinition[] {
  if (themeLibraryCache) return themeLibraryCache;
  if (typeof window === "undefined") {
    themeLibraryCache = [];
    return themeLibraryCache;
  }

  const customThemes: ThemeDefinition[] = [];
  try {
    const raw = localStorage.getItem(THEME_LIBRARY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const normalized = normalizeThemeRecord(item);
          if (normalized) customThemes.push(normalized);
        }
      }
    }
  } catch {
    // ignore corrupted custom theme storage
  }

  themeLibraryCache = customThemes;
  return themeLibraryCache;
}

function persistLibrary(themes: ThemeDefinition[]) {
  themeLibraryCache = themes;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_LIBRARY_KEY, JSON.stringify(themes));
  } catch {
    // ignore write failures
  }
}

function makeThemeLibrary() {
  const custom = readStoredLibrary();
  return [...BUILTIN_THEMES.map(copyTheme), ...custom.map(copyTheme)];
}

function resolveThemeId(value: unknown): string {
  const normalized = normalizeThemeId(value);
  return normalized ?? DEFAULT_THEME;
}

function getThemeLibrary() {
  return makeThemeLibrary();
}

function getThemeRecord(id: string): ThemeDefinition | undefined {
  return getThemeLibrary().find((theme) => theme.id === id);
}

function getEffectiveThemeId(): string {
  if (previewThemeId) {
    const preview = getThemeRecord(previewThemeId);
    if (preview) return preview.id;
  }

  const stored = resolveThemeId(readStoredThemeId());
  const storedRecord = getThemeRecord(stored);
  return storedRecord?.id ?? DEFAULT_THEME;
}

function sanitizeTokens(raw: unknown, fallback: ThemeTokens): ThemeTokens {
  const output = { ...fallback };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return output;
  const candidate = raw as Record<string, unknown>;
  for (const key of Object.keys(fallback) as Array<keyof ThemeTokens>) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim()) {
      output[key] = value;
    }
  }
  return output;
}

function sanitizeSwatch(raw: unknown, fallback: [string, string, string]): [string, string, string] {
  if (!Array.isArray(raw) || raw.length < 3) return fallback;
  const candidate = raw.slice(0, 3).map((value) => (typeof value === "string" && value.trim() ? value : null));
  if (candidate.every((value) => typeof value === "string")) {
    return candidate as [string, string, string];
  }
  return fallback;
}

function normalizeThemeRecord(raw: unknown): ThemeDefinition | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : null;
  const label = typeof item.label === "string" && item.label.trim() ? item.label.trim() : null;
  const base = (id && getThemeById(id)) || BUILTIN_THEMES[0];
  if (!label) return null;
  const baseId = id ?? createThemeId(label);
  const uniqueId = ensureUniqueThemeId(baseId, getThemeLibrary());
  const swatch = sanitizeSwatch(item.swatch, base.swatch);
  const tokens = sanitizeTokens(item.tokens, base.tokens);
  return {
    id: uniqueId,
    label,
    swatch,
    tokens,
    description: typeof item.description === "string" ? item.description : undefined,
    source: "custom",
  };
}

function commitThemeLibrary(next: ThemeDefinition[]) {
  persistLibrary(next);
  listeners.forEach((listener) => listener());
}

function findLibraryIndex(id: string) {
  return readStoredLibrary().findIndex((theme) => theme.id === id);
}

function createThemeId(label: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || `theme-${Date.now().toString(36)}`;
}

function ensureUniqueThemeId(baseId: string, library: ThemeDefinition[]) {
  if (!library.some((theme) => theme.id === baseId)) return baseId;
  let suffix = 2;
  let next = `${baseId}-${suffix}`;
  while (library.some((theme) => theme.id === next)) {
    suffix += 1;
    next = `${baseId}-${suffix}`;
  }
  return next;
}

type ThemeDraft = {
  id?: string;
  label: string;
  tokens: Partial<ThemeTokens>;
  swatch?: [string, string, string];
  description?: string;
};

function normalizeThemeDefinition(input: ThemeDraft): ThemeDefinition {
  const fallback = BUILTIN_THEMES[0];
  const idBase = typeof input.id === "string" && input.id.trim() ? input.id.trim() : createThemeId(input.label);
  const library = getThemeLibrary();
  const id = ensureUniqueThemeId(idBase, library);
  const swatch = sanitizeSwatch(input.swatch, fallback.swatch);
  const tokens = sanitizeTokens(input.tokens, fallback.tokens);
  return {
    id,
    label: input.label.trim(),
    swatch,
    tokens,
    description: input.description?.trim() || undefined,
    source: "custom",
  };
}

function applyThemeRecord(theme: ThemeDefinition) {
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  root.dataset.themeSource = theme.source ?? "builtin";
  for (const key of Object.keys(theme.tokens) as Array<keyof ThemeTokens>) {
    root.style.setProperty(key, theme.tokens[key]);
  }
}

export function getThemeCatalog(): ThemeDefinition[] {
  return getThemeLibrary().map(copyTheme);
}

export function getThemeDefinition(id: string): ThemeDefinition {
  return copyTheme(getThemeRecord(resolveThemeId(id)) ?? BUILTIN_THEMES[0]);
}

export function getThemeMode(): ThemeMode {
  return getEffectiveThemeId();
}

export function getServerThemeMode(): ThemeMode {
  return DEFAULT_THEME;
}

export function applyTheme() {
  const theme = getThemeRecord(getEffectiveThemeId()) ?? BUILTIN_THEMES[0];
  applyThemeRecord(theme);
}

export function setThemeMode(mode: ThemeMode) {
  const resolved = resolveThemeId(mode);
  previewThemeId = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ACTIVE_THEME_KEY, resolved);
    } catch {
      // ignore storage failures
    }
  }
  applyTheme();
  listeners.forEach((listener) => listener());
}

export function previewThemeMode(mode: ThemeMode) {
  previewThemeId = resolveThemeId(mode);
  applyTheme();
  listeners.forEach((listener) => listener());
}

export function clearThemePreview() {
  if (!previewThemeId) return;
  previewThemeId = null;
  applyTheme();
  listeners.forEach((listener) => listener());
}

export function getPreviewThemeMode(): ThemeMode | null {
  return previewThemeId;
}

export function exportTheme(id: string = getThemeMode()) {
  return JSON.stringify(getThemeDefinition(id));
}

export function importTheme(raw: string) {
  const parsed = JSON.parse(raw);
  const normalized = normalizeThemeRecord(parsed);
  if (!normalized) throw new Error("Invalid theme payload");
  const library = readStoredLibrary();
  const next = [...library.filter((theme) => theme.id !== normalized.id), normalized];
  commitThemeLibrary(next);
  setThemeMode(normalized.id);
  return normalized;
}

export function createTheme(input: { label: string; tokens: Partial<ThemeTokens>; swatch?: [string, string, string]; description?: string }) {
  if (!input.label.trim()) throw new Error("Theme label is required");
  const library = readStoredLibrary();
  const theme = normalizeThemeDefinition({
    label: input.label,
    tokens: input.tokens,
    swatch: input.swatch,
    description: input.description,
  });
  const next = [...library.filter((item) => item.id !== theme.id), theme];
  commitThemeLibrary(next);
  return theme;
}

export function cloneTheme(sourceId: string, label?: string) {
  const source = getThemeRecord(resolveThemeId(sourceId));
  if (!source) throw new Error("Source theme not found");
  return createTheme({
    label: label?.trim() || `${source.label} Copy`,
    tokens: source.tokens,
    swatch: source.swatch,
    description: source.description,
  });
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
