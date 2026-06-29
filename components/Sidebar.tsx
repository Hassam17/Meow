"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Bot,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutGrid,
  Search,
  Sparkles,
  Trophy,
  Dumbbell,
  Code2,
  Grid2x2,
  Palette,
  Settings2,
} from "lucide-react";
import { widgetRegistry } from "@/widgets/registry";

const STORAGE_KEY = "nutmag-sidebar";

type SidebarState = {
  collapsed: boolean;
  search: string;
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
  return { collapsed: false, search: "", commandOpen: false };
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

  function toggleCollapse() {
    setState((current) => ({ ...current, collapsed: !current.collapsed }));
  }

  function openAssistant() {
    window.dispatchEvent(new CustomEvent("nutmag-open-assistant"));
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
                <div className="sidebar-subtitle">Navigation surface · launcher only</div>
              </div>
            )}
          </div>
          <button type="button" className="sidebar-collapse-btn" onClick={toggleCollapse} aria-label="collapse sidebar">
            {state.collapsed ? <ChevronRight size={14} strokeWidth={1.8} /> : <ChevronLeft size={14} strokeWidth={1.8} />}
          </button>
        </div>

        <div className="sidebar-rail-note">
          {!state.collapsed && "Use the right rail for settings, layout, themes, and companion controls."}
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
          <input
            className="sidebar-search"
            value={state.search}
            onChange={(e) => setState((current) => ({ ...current, search: e.target.value }))}
            placeholder="Search widgets..."
          />
          <div className="sidebar-search-results">
            {filteredWidgets.slice(0, 8).map((widget) => (
              <button key={widget.id} type="button" className="sidebar-result">
                {widget.title}
              </button>
            ))}
          </div>
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
