"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Command,
  LayoutGrid,
  Search,
  Sparkles,
  SlidersHorizontal,
  SquareTerminal,
  Grid2x2,
  Trophy,
  Dumbbell,
  Code2,
  Palette,
  Settings2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { THEME_PACKS } from "@/config/themes";
import type { WidgetId } from "@/config/widgets";
import { useLayout } from "@/components/LayoutProvider";
import { useTheme } from "@/components/ThemeProvider";
import { widgetRegistry } from "@/widgets/registry";
import { setThemeMode, type ThemeMode } from "@/lib/theme";
import {
  exportLayout,
  type LayoutPreset,
  type LayoutMode,
} from "@/lib/layout";

const STORAGE_KEY = "nutmag-sidebar";

type SidebarState = {
  collapsed: boolean;
  search: string;
  paletteFilter: string;
  commandOpen: boolean;
};

const COMMANDS = [
  { id: "theme", label: "/theme" },
  { id: "add-widget", label: "/add-widget" },
  { id: "remove-widget", label: "/remove-widget" },
  { id: "show-widget", label: "/show-widget" },
  { id: "hide-widget", label: "/hide-widget" },
  { id: "open", label: "/open" },
];

const LAYOUT_OPTIONS: { id: LayoutMode; label: string }[] = [
  { id: "grid", label: "Grid" },
  { id: "channels", label: "Workspace" },
];

const PRESETS: { id: LayoutPreset; label: string }[] = [
  { id: "productivity", label: "Productivity" },
  { id: "football", label: "Football" },
  { id: "gym", label: "Gym" },
  { id: "development", label: "Development" },
];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "football", label: "Football", icon: Trophy },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "development", label: "Development", icon: Code2 },
  { id: "planner", label: "Planner", icon: ArrowRightLeft },
  { id: "analytics", label: "Analytics", icon: Grid2x2 },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "settings", label: "Settings", icon: Settings2 },
];

function defaultState(): SidebarState {
  return { collapsed: false, search: "", paletteFilter: "", commandOpen: false };
}

function readStoredState(): Partial<SidebarState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SidebarState>;
    return typeof parsed === "object" && parsed ? parsed : null;
  } catch {
    return null;
  }
}

export function DashboardSidebar() {
  const {
    layout,
    updateInstance,
    reorderWidget,
    setLayoutPreset: applyPreset,
    setLayoutMode: applyMode,
    setGridConfig: applyGridConfig,
    setGridDebug: applyGridDebug,
    resetLayout,
  } = useLayout();
  const { theme } = useTheme();
  const [state, setState] = useState<SidebarState>(defaultState);

  useEffect(() => {
    const stored = readStoredState();
    if (stored) setState((current) => ({ ...current, ...stored }));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const filteredWidgets = useMemo(() => {
    const query = state.search.trim().toLowerCase();
    return widgetRegistry.filter((widget) => {
      if (!query) return true;
      return widget.id.toLowerCase().includes(query) || widget.title.toLowerCase().includes(query);
    });
  }, [state.search]);

  function moveWidget(id: string, direction: "up" | "down") {
    const index = layout.widgets.findIndex((widget) => widget.id === id);
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || nextIndex < 0 || nextIndex >= layout.widgets.length) return;
    reorderWidget(layout.widgets[index].id, layout.widgets[nextIndex].id);
  }

  function toggleCollapse() {
    setState((current) => ({ ...current, collapsed: !current.collapsed }));
  }

  function openAssistant() {
    window.dispatchEvent(new CustomEvent("nutmag-open-assistant"));
  }

  function jumpTheme(id: ThemeMode) {
    setThemeMode(id);
  }

  return (
    <aside className={`dashboard-sidebar${state.collapsed ? " collapsed" : ""}`}>
      <div className="sidebar-shell">
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <span className="sidebar-brand-mark">
              <Sparkles size={14} strokeWidth={1.8} />
            </span>
            {!state.collapsed && (
              <div>
                <div className="sidebar-title">Dashboard</div>
                <div className="sidebar-subtitle">Layout control center · {theme}</div>
              </div>
            )}
          </div>
          <button type="button" className="sidebar-collapse-btn" onClick={toggleCollapse} aria-label="collapse sidebar">
            {state.collapsed ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" className="sidebar-nav-item">
                <Icon size={14} strokeWidth={1.8} />
                {!state.collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <Palette size={12} strokeWidth={1.8} />
            {!state.collapsed && "Theme Selector"}
          </div>
          <div className="sidebar-theme-grid">
            {THEME_PACKS.map((pack) => (
              <button key={pack.id} type="button" className="sidebar-theme-btn" onClick={() => jumpTheme(pack.id)}>
                <span className="sidebar-theme-swatch">
                  <span style={{ background: pack.swatch[0] }} />
                  <span style={{ background: pack.swatch[1] }} />
                  <span style={{ background: pack.swatch[2] }} />
                </span>
                {!state.collapsed && <span>{pack.label}</span>}
              </button>
            ))}
            <button type="button" className="sidebar-theme-btn" onClick={() => jumpTheme("mission-control")}>
              <span className="sidebar-theme-swatch">
                <span style={{ background: "#0c1220" }} />
                <span style={{ background: "#60a5fa" }} />
                <span style={{ background: "#94a3b8" }} />
              </span>
              {!state.collapsed && <span>Raycast</span>}
            </button>
          </div>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <LayoutGrid size={12} strokeWidth={1.8} />
            {!state.collapsed && "Layout Manager"}
          </div>
          <div className="sidebar-chip-row">
            {LAYOUT_OPTIONS.map((option) => (
              <button key={option.id} type="button" className="sidebar-chip" onClick={() => applyMode(option.id)}>
                {option.label}
              </button>
            ))}
          </div>
          <div className="sidebar-chip-row">
            {PRESETS.map((preset) => (
              <button key={preset.id} type="button" className="sidebar-chip" onClick={() => applyPreset(preset.id)}>
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <Grid2x2 size={12} strokeWidth={1.8} />
            {!state.collapsed && "Widget Manager"}
          </div>
          <input
            className="sidebar-search"
            value={state.search}
            onChange={(e) => setState((current) => ({ ...current, search: e.target.value }))}
            placeholder="Search widgets..."
          />
          <div className="sidebar-widget-list">
            {filteredWidgets.map((widget) => {
              const current = layout.widgets.find((entry) => entry.id === widget.id);
              const enabled = current ? !current.hidden : widget.enabled;
              return (
                <div key={widget.id} className={`sidebar-widget-item${enabled ? "" : " disabled"}`}>
                  <button type="button" className="sidebar-widget-main" onClick={() => updateInstance(widget.id as WidgetId, { hidden: !enabled })}>
                    <span className="sidebar-widget-left">
                      {enabled ? <Eye size={12} strokeWidth={1.8} /> : <EyeOff size={12} strokeWidth={1.8} />}
                      {!state.collapsed && <span>{widget.title}</span>}
                    </span>
                  </button>
                  {!state.collapsed && (
                    <span className="sidebar-widget-actions">
                      <button type="button" className="sidebar-mini-btn" onClick={() => moveWidget(widget.id, "up")}>
                        <ChevronUp size={11} strokeWidth={1.8} />
                      </button>
                      <button type="button" className="sidebar-mini-btn" onClick={() => moveWidget(widget.id, "down")}>
                        <ChevronDown size={11} strokeWidth={1.8} />
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <button type="button" className="sidebar-action" onClick={() => localStorage.setItem("nutmag-layout", exportLayout())}>
            <RefreshCw size={12} strokeWidth={1.8} />
            {!state.collapsed && "Save preferences"}
          </button>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <LayoutGrid size={12} strokeWidth={1.8} />
            {!state.collapsed && "Grid Generation"}
          </div>
          <div className="sidebar-grid-controls">
            <label className="sidebar-grid-control">
              <span>Rows</span>
              <input
                type="number"
                min={4}
                max={48}
                value={layout.grid.rows}
                onChange={(e) => applyGridConfig({ rows: Number(e.target.value) })}
              />
            </label>
            <label className="sidebar-grid-control">
              <span>Columns</span>
              <input
                type="number"
                min={1}
                max={24}
                value={layout.grid.columns}
                onChange={(e) => applyGridConfig({ columns: Number(e.target.value) })}
              />
            </label>
            <label className="sidebar-grid-control">
              <span>Gap</span>
              <input
                type="number"
                min={0}
                max={40}
                value={layout.grid.gap}
                onChange={(e) => applyGridConfig({ gap: Number(e.target.value) })}
              />
            </label>
          </div>
          <button type="button" className={`sidebar-action${layout.grid.debug ? " active" : ""}`} onClick={() => applyGridDebug(!layout.grid.debug)}>
            <Eye size={12} strokeWidth={1.8} />
            {!state.collapsed && (layout.grid.debug ? "Hide grid debug" : "Show grid debug")}
          </button>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <Command size={12} strokeWidth={1.8} />
            {!state.collapsed && "Quick Actions"}
          </div>
          <button type="button" className="sidebar-action" onClick={openAssistant}>
            <Bot size={12} strokeWidth={1.8} />
            {!state.collapsed && "AI Assistant Access"}
          </button>
          <button type="button" className="sidebar-action" onClick={() => setState((current) => ({ ...current, commandOpen: true }))}>
            <Command size={12} strokeWidth={1.8} />
            {!state.collapsed && "Command Palette"}
          </button>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <Search size={12} strokeWidth={1.8} />
            {!state.collapsed && "Global Search"}
          </div>
          <div className="sidebar-search-results">
            {filteredWidgets.slice(0, 8).map((widget) => (
              <button key={widget.id} type="button" className="sidebar-result">
                {widget.title}
              </button>
            ))}
          </div>
        </section>

        <section className="sidebar-section">
          <div className="sidebar-section-title">
            <SlidersHorizontal size={12} strokeWidth={1.8} />
            {!state.collapsed && "Settings"}
          </div>
          <button type="button" className="sidebar-action" onClick={resetLayout}>
            <RefreshCw size={12} strokeWidth={1.8} />
            {!state.collapsed && "Reset layout"}
          </button>
        </section>
      </div>

      {state.commandOpen && (
        <div className="sidebar-command-palette" role="dialog" aria-modal="true">
          <div className="sidebar-command-card">
            <div className="sidebar-command-head">
              <span>Command Palette</span>
              <button type="button" className="sidebar-collapse-btn" onClick={() => setState((current) => ({ ...current, commandOpen: false }))}>
                <ChevronRight size={14} strokeWidth={1.8} />
              </button>
            </div>
            <div className="sidebar-command-list">
              {COMMANDS.map((command) => (
                <button key={command.id} type="button" className="sidebar-result" onClick={() => window.dispatchEvent(new CustomEvent("nutmag-command", { detail: command.label }))}>
                  {command.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
