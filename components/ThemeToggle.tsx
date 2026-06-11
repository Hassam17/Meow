"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "nutmag-theme";
const listeners = new Set<() => void>();

function getSnapshot(): "dark" | "light" {
  return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

function getServerSnapshot(): "dark" | "light" {
  return "dark";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTheme(theme: "dark" | "light") {
  localStorage.setItem(STORAGE_KEY, theme);
  if (theme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    delete document.documentElement.dataset.theme;
  }
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Toggle theme"
      className="theme-toggle"
    >
      {theme === "light" ? <Moon size={14} strokeWidth={1.75} /> : <Sun size={14} strokeWidth={1.75} />}
    </button>
  );
}
