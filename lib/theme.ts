import { DEFAULT_THEME, isThemeId, type ThemeId } from "@/config/themes";

const STORAGE_KEY = "nutmag-theme";
const listeners = new Set<() => void>();

export type ThemeMode = ThemeId;

function resolveStoredTheme(value: string | null): ThemeMode {
  return isThemeId(value) ? value : DEFAULT_THEME;
}

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
