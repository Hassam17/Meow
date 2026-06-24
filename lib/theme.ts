// Shared theme store for the dashboard's visual modes. The selected theme
// only changes CSS variables via <html data-theme="...">, so widgets keep
// their business logic and inherit the active palette automatically.

import { DEFAULT_THEME, isThemeId, type ThemeId } from "@/config/themes";

const STORAGE_KEY = "nutmag-theme";
const listeners = new Set<() => void>();

function resolveStoredTheme(value: string | null): ThemeId {
  if (isThemeId(value)) return value;
  if (value === "auto") return DEFAULT_THEME;
  return DEFAULT_THEME;
}

export type ThemeMode = ThemeId;

export function getThemeMode(): ThemeMode {
  return resolveStoredTheme(localStorage.getItem(STORAGE_KEY));
}

export function getServerThemeMode(): ThemeMode {
  return DEFAULT_THEME;
}

export function applyTheme() {
  const next = getThemeMode();
  if (document.documentElement.dataset.theme !== next) {
    document.documentElement.dataset.theme = next;
  }
}

export function setThemeMode(mode: ThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme();
  listeners.forEach((listener) => listener());
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
