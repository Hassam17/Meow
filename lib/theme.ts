// Shared theme store — light / dark / auto (auto follows time of day).
// Backed by the same "nutmag-theme" localStorage key the pre-paint script
// in app/layout.tsx reads, so there's no flash on load. Client-side only.

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "nutmag-theme";
const listeners = new Set<() => void>();

export function getThemeMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "auto" ? stored : "dark";
}

export function getServerThemeMode(): ThemeMode {
  return "dark";
}

function resolve(mode: ThemeMode): "light" | "dark" {
  if (mode !== "auto") return mode;
  const hour = new Date().getHours();
  return hour >= 20 || hour < 6 ? "dark" : "light";
}

/** Apply the resolved theme to <html data-theme>. Cheap to call repeatedly —
 *  only touches the DOM when the resolved theme actually changes (auto mode
 *  flips at 06:00 / 20:00, so callers can re-run this on a timer). */
export function applyTheme() {
  const light = resolve(getThemeMode()) === "light";
  const isLight = document.documentElement.dataset.theme === "light";
  if (light && !isLight) {
    document.documentElement.dataset.theme = "light";
  } else if (!light && isLight) {
    delete document.documentElement.dataset.theme;
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
