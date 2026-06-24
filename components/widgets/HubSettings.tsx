"use client";

// The hub's own control surface — itself a widget. The card shows quick
// theme controls and a visibility summary; the overlay (click to open) is
// the full panel: widget visibility checklist, global prefs, layout reset.

import { useSyncExternalStore } from "react";
import { CircleDashed, Eye, EyeOff, Moon, RotateCcw, SlidersHorizontal, Sparkles, Sun, SunMoon } from "lucide-react";
import { WIDGETS, DEFAULT_ORDER } from "@/config/widgets";
import { THEME_PACKS } from "@/config/themes";
import type { LayoutMode } from "@/lib/layout";
import {
  getServerThemeMode,
  getThemeMode,
  setThemeMode,
  subscribeTheme,
  type ThemeMode,
} from "@/lib/theme";
import { getPrefs, getServerPrefs, setPrefs, subscribePrefs } from "@/lib/prefs";
import { useLayout } from "@/components/LayoutProvider";

const THEME_OPTIONS: { mode: ThemeMode; Icon: typeof Sun }[] = [
  { mode: "cyber", Icon: Sparkles },
  { mode: "fifa", Icon: CircleDashed },
  { mode: "mission-control", Icon: Sun },
  { mode: "glass", Icon: Moon },
  { mode: "retro", Icon: SunMoon },
];
const LAYOUT_OPTIONS: LayoutMode[] = ["channels", "grid"];

function ThemeModeRow() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, getServerThemeMode);
  return (
    <div className="seg-row">
      {THEME_OPTIONS.map(({ mode: m, Icon }) => (
        <button
          key={m}
          type="button"
          className={`seg-btn${mode === m ? " active" : ""}`}
          onClick={() => setThemeMode(m)}
        >
          <Icon size={12} strokeWidth={1.75} />
          {m}
        </button>
      ))}
    </div>
  );
}

function PaletteRow() {
  const mode = useSyncExternalStore(subscribeTheme, getThemeMode, getServerThemeMode);
  return (
    <div className="palette-row">
      {THEME_PACKS.map((pack) => (
        <button
          key={pack.id}
          type="button"
          className={`palette-btn${mode === pack.id ? " active" : ""}`}
          onClick={() => setThemeMode(pack.id)}
          title={`${pack.label} palette`}
        >
          <span className="palette-swatch" style={{ background: pack.swatch[0] }}>
            <span style={{ background: pack.swatch[1] }} />
            <span style={{ background: pack.swatch[2] }} />
          </span>
          {pack.label}
        </button>
      ))}
    </div>
  );
}

function LayoutModeRow() {
  const { layout, setLayoutMode } = useLayout();
  return (
    <div className="seg-row">
      {LAYOUT_OPTIONS.map((mode) => (
        <button
          key={mode}
          type="button"
          className={`seg-btn${layout.layoutMode === mode ? " active" : ""}`}
          onClick={() => setLayoutMode(mode)}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}

export function HubSettings() {
  const { layout } = useLayout();
  const visibleCount = layout.widgets.filter((w) => !w.hidden).length;

  return (
    <>
      <div className="wset-row">
        <span>theme</span>
        <ThemeModeRow />
      </div>
      <div className="wset-row">
        <span>layout</span>
        <LayoutModeRow />
      </div>
      <PaletteRow />
      <div className="hub-summary">
        <SlidersHorizontal size={12} strokeWidth={1.75} />
        {layout.layoutMode} mode · {visibleCount}/{layout.widgets.length} widgets shown
      </div>
    </>
  );
}

export function HubSettingsMore() {
  const { layout, updateInstance, resetLayout } = useLayout();
  const prefs = useSyncExternalStore(subscribePrefs, getPrefs, getServerPrefs);

  return (
    <>
      <div className="more-head">layout</div>
      <div className="wset-row">
        <span>mode</span>
        <LayoutModeRow />
      </div>

      <div className="more-head">theme</div>
      <div className="wset-row">
        <span>mode</span>
        <ThemeModeRow />
      </div>
      <div className="wset-row">
        <span>palette</span>
        <PaletteRow />
      </div>

      <div className="more-head">widgets</div>
      <div className="hub-list">
        {DEFAULT_ORDER.map((id) => {
          const manifest = WIDGETS[id];
          const instance = layout.widgets.find((w) => w.id === id);
          if (!instance) return null;
          const Icon = manifest.icon;
          const locked = id === "hub-settings";
          return (
            <button
              key={id}
              type="button"
              className={`hub-item${instance.hidden ? " off" : ""}`}
              disabled={locked}
              onClick={() => updateInstance(id, { hidden: !instance.hidden })}
              title={locked ? "the hub can't hide itself" : instance.hidden ? "show widget" : "hide widget"}
            >
              <Icon size={13} strokeWidth={1.75} />
              <span className="hub-item-title">{manifest.title}</span>
              {instance.hidden ? <EyeOff size={12} strokeWidth={1.75} /> : <Eye size={12} strokeWidth={1.75} />}
            </button>
          );
        })}
      </div>

      <div className="more-head">general</div>
      <label className="wset-row">
        <span>live data polling</span>
        <input
          type="checkbox"
          checked={prefs.pollingEnabled}
          onChange={(e) => setPrefs({ pollingEnabled: e.target.checked })}
        />
      </label>
      <label className="wset-row">
        <span>boot sequence intro</span>
        <input
          type="checkbox"
          checked={prefs.bootSequence}
          onChange={(e) => setPrefs({ bootSequence: e.target.checked })}
        />
      </label>

      <button type="button" className="wset-hide-btn hub-reset" onClick={resetLayout}>
        <RotateCcw size={12} strokeWidth={1.75} />
        reset layout & widget config
      </button>
    </>
  );
}
