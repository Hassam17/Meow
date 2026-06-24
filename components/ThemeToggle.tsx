"use client";

import { useSyncExternalStore } from "react";
import { CircleDashed, Moon, Sparkles, Sun, SunMoon } from "lucide-react";
import { getServerThemeMode, getThemeMode, setThemeMode, subscribeTheme, type ThemeMode } from "@/lib/theme";

const ORDER: ThemeMode[] = ["cyber", "football-manager", "mission-control", "glass", "retro", "minimal"];
const ICONS = { cyber: Sparkles, "football-manager": CircleDashed, "mission-control": Sun, glass: Moon, retro: SunMoon, minimal: CircleDashed } as const;

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, getServerThemeMode);
  const Icon = ICONS[mode];
  const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];

  return (
    <button
      type="button"
      onClick={() => setThemeMode(next)}
      aria-label={`Theme: ${mode} — switch to ${next}`}
      title={`theme: ${mode}`}
      className="theme-toggle"
    >
      <Icon size={14} strokeWidth={1.75} />
    </button>
  );
}
