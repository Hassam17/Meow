"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Layers3,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useLayout } from "@/components/LayoutProvider";
import { useTheme } from "@/components/ThemeProvider";
import type { WidgetId } from "@/config/widgets";
import { widgetRegistry } from "@/widgets/registry";
import { exportLayout, importLayout, loadLayoutSnapshot, saveLayoutSnapshot } from "@/lib/layout";
import {
  clearThemePreview,
  cloneTheme,
  createTheme,
  exportTheme,
  getThemeCatalog,
  getThemeDefinition,
  importTheme,
  previewThemeMode,
  type ThemeMode,
} from "@/lib/theme";

type PanelSection = "grid" | "theme" | "widget" | "layout" | "companion";

const PANEL_STORAGE = "nutmag-settings-panel";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(PANEL_STORAGE) === "collapsed";
  } catch {
    return false;
  }
}

function readImportBuffer(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(`${PANEL_STORAGE}:import`) ?? "";
  } catch {
    return "";
  }
}

export function RightCompanionPanel() {
  const { layout, addWidgetInstance, removeWidgetInstance, setWidgetEnabled, setGridConfig, setGridDebug, resetLayout } = useLayout();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed());
  const [selectedWidget, setSelectedWidget] = useState<WidgetId>(widgetRegistry[0]?.id as WidgetId);
  const [importValue, setImportValue] = useState<string>(() => readImportBuffer());
  const [themeImportValue, setThemeImportValue] = useState<string>("");
  const [themeLabel, setThemeLabel] = useState<string>("");
  const [activeSections, setActiveSections] = useState<Record<PanelSection, boolean>>({
    grid: true,
    theme: true,
    widget: true,
    layout: true,
    companion: true,
  });

  const currentWidget = useMemo(
    () => widgetRegistry.find((entry) => entry.id === selectedWidget) ?? widgetRegistry[0],
    [selectedWidget],
  );
  const themeCatalog = useMemo(() => getThemeCatalog(), [theme]);
  const activeTheme = useMemo(() => getThemeDefinition(theme), [theme]);

  const selectedEnabled = layout.widgets.find((widget) => widget.id === currentWidget?.id && !widget.hidden) !== undefined;

  function persistCollapsed(next: boolean) {
    setCollapsed(next);
    try {
      localStorage.setItem(PANEL_STORAGE, next ? "collapsed" : "open");
    } catch {
      // ignore
    }
  }

  function persistImport(value: string) {
    setImportValue(value);
    try {
      localStorage.setItem(`${PANEL_STORAGE}:import`, value);
    } catch {
      // ignore
    }
  }

  function toggleSection(section: PanelSection) {
    setActiveSections((current) => ({ ...current, [section]: !current[section] }));
  }

  function applyTheme(mode: ThemeMode) {
    setTheme(mode);
  }

  function previewTheme(mode: ThemeMode) {
    previewThemeMode(mode);
  }

  function finishThemePreview() {
    clearThemePreview();
  }

  function handleThemeImport() {
    if (!themeImportValue.trim()) return;
    importTheme(themeImportValue);
    setThemeImportValue("");
  }

  function handleThemeCreate() {
    if (!themeLabel.trim()) return;
    const created = createTheme({
      label: themeLabel.trim(),
      tokens: activeTheme.tokens,
      swatch: activeTheme.swatch,
      description: activeTheme.description,
    });
    setTheme(created.id);
    setThemeLabel("");
  }

  function handleThemeClone() {
    const cloned = cloneTheme(theme, themeLabel.trim() || undefined);
    setTheme(cloned.id);
    setThemeLabel("");
  }

  function handleImport() {
    if (!importValue.trim()) return;
    importLayout(importValue);
  }

  return (
    <aside className={`right-companion-panel${collapsed ? " collapsed" : ""}`}>
      <div className="right-companion-head">
        <div>
          <div className="right-companion-kicker">
            <Settings2 size={12} strokeWidth={1.9} />
            Grid Operating System
          </div>
          <div className="right-companion-title">Control Panel</div>
        </div>
        <button type="button" className="right-companion-toggle" onClick={() => persistCollapsed(!collapsed)} aria-label="toggle settings panel">
          <ChevronRight size={14} strokeWidth={1.9} />
        </button>
      </div>

      {!collapsed && (
        <div className="right-settings-shell">
          <section className="right-settings-section">
            <button type="button" className="right-settings-section-head" onClick={() => toggleSection("grid")}>
              <span>Grid Settings</span>
              <span>{activeSections.grid ? "−" : "+"}</span>
            </button>
            {activeSections.grid && (
              <div className="right-settings-grid">
                <label className="right-settings-field">
                  <span>Rows</span>
                  <input type="number" min={1} max={48} value={layout.grid.rows} onChange={(e) => setGridConfig({ rows: Number(e.target.value) })} />
                </label>
                <label className="right-settings-field">
                  <span>Columns</span>
                  <input type="number" min={1} max={24} value={layout.grid.columns} onChange={(e) => setGridConfig({ columns: Number(e.target.value) })} />
                </label>
                <label className="right-settings-field">
                  <span>Gap</span>
                  <input type="number" min={0} max={40} value={layout.grid.gap} onChange={(e) => setGridConfig({ gap: Number(e.target.value) })} />
                </label>
                <label className="right-settings-field">
                  <span>Padding</span>
                  <input type="number" min={0} max={64} value={layout.grid.padding} onChange={(e) => setGridConfig({ padding: Number(e.target.value) })} />
                </label>
                <button type="button" className={`right-settings-action${layout.grid.debug ? " active" : ""}`} onClick={() => setGridDebug(!layout.grid.debug)}>
                  {layout.grid.debug ? <EyeOff size={12} strokeWidth={1.8} /> : <Eye size={12} strokeWidth={1.8} />}
                  {layout.grid.debug ? "Hide debug" : "Show debug"}
                </button>
              </div>
            )}
          </section>

          <section className="right-settings-section">
            <button type="button" className="right-settings-section-head" onClick={() => toggleSection("theme")}>
              <span>Theme Settings</span>
              <span>{activeSections.theme ? "−" : "+"}</span>
            </button>
            {activeSections.theme && (
              <div className="right-settings-grid">
                <div className="right-settings-preview-grid">
                  {themeCatalog.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      className={`right-settings-preview${theme === pack.id ? " active" : ""}`}
                      onClick={() => applyTheme(pack.id)}
                      onMouseEnter={() => previewTheme(pack.id)}
                      onMouseLeave={finishThemePreview}
                      onFocus={() => previewTheme(pack.id)}
                      onBlur={finishThemePreview}
                    >
                      <span className="right-settings-preview-surface">
                        <span className="right-settings-preview-glow" style={{ background: `linear-gradient(135deg, ${pack.swatch[0]}, ${pack.swatch[1]})` }} />
                        <span className="right-settings-preview-bars">
                          <span style={{ background: pack.swatch[0] }} />
                          <span style={{ background: pack.swatch[1] }} />
                          <span style={{ background: pack.swatch[2] }} />
                        </span>
                      </span>
                      <span className="right-settings-preview-title">{pack.label}</span>
                      <span className="right-settings-preview-meta">{pack.id}</span>
                    </button>
                  ))}
                </div>
                <div className="right-settings-tools">
                  <label className="right-settings-field">
                    <span>Theme name</span>
                    <input value={themeLabel} onChange={(e) => setThemeLabel(e.target.value)} placeholder="Custom theme name" />
                  </label>
                  <div className="right-settings-actions-row">
                    <button type="button" className="right-settings-action" onClick={handleThemeCreate}>
                      <Palette size={12} strokeWidth={1.8} />
                      Create Theme
                    </button>
                    <button type="button" className="right-settings-action" onClick={handleThemeClone}>
                      <Plus size={12} strokeWidth={1.8} />
                      Clone Theme
                    </button>
                    <button type="button" className="right-settings-action" onClick={() => setThemeImportValue(exportTheme(theme))}>
                      <Download size={12} strokeWidth={1.8} />
                      Export Theme
                    </button>
                  </div>
                  <textarea
                    className="right-settings-import"
                    value={themeImportValue}
                    onChange={(e) => setThemeImportValue(e.target.value)}
                    placeholder="Paste exported theme JSON here"
                    rows={5}
                  />
                  <div className="right-settings-actions-row">
                    <button type="button" className="right-settings-action" onClick={handleThemeImport}>
                      <Upload size={12} strokeWidth={1.8} />
                      Import Theme
                    </button>
                    <button type="button" className="right-settings-action" onClick={() => previewTheme(activeTheme.id)}>
                      <Eye size={12} strokeWidth={1.8} />
                      Preview Active
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="right-settings-section">
            <button type="button" className="right-settings-section-head" onClick={() => toggleSection("widget")}>
              <span>Widget Settings</span>
              <span>{activeSections.widget ? "−" : "+"}</span>
            </button>
            {activeSections.widget && (
              <div className="right-settings-grid">
                <label className="right-settings-field">
                  <span>Widget</span>
                  <select value={currentWidget?.id ?? ""} onChange={(e) => setSelectedWidget(e.target.value as WidgetId)}>
                    {widgetRegistry.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="right-settings-actions-row">
                  <button type="button" className="right-settings-action" onClick={() => currentWidget && addWidgetInstance(currentWidget.id as WidgetId)}>
                    <Plus size={12} strokeWidth={1.8} />
                    Add Widget
                  </button>
                  <button type="button" className="right-settings-action" onClick={() => currentWidget && removeWidgetInstance(currentWidget.id as WidgetId)}>
                    <Trash2 size={12} strokeWidth={1.8} />
                    Remove Widget
                  </button>
                  <button type="button" className="right-settings-action" onClick={() => currentWidget && setWidgetEnabled(currentWidget.id as WidgetId, true)}>
                    <Eye size={12} strokeWidth={1.8} />
                    Enable Widget
                  </button>
                  <button type="button" className="right-settings-action" onClick={() => currentWidget && setWidgetEnabled(currentWidget.id as WidgetId, false)}>
                    <EyeOff size={12} strokeWidth={1.8} />
                    Disable Widget
                  </button>
                </div>
                <div className="right-settings-meta">Selected widget is {selectedEnabled ? "enabled" : "hidden"}</div>
              </div>
            )}
          </section>

          <section className="right-settings-section">
            <button type="button" className="right-settings-section-head" onClick={() => toggleSection("layout")}>
              <span>Layout Settings</span>
              <span>{activeSections.layout ? "−" : "+"}</span>
            </button>
            {activeSections.layout && (
              <div className="right-settings-grid">
                <div className="right-settings-actions-row">
                  <button type="button" className="right-settings-action" onClick={() => saveLayoutSnapshot()}>
                    <Save size={12} strokeWidth={1.8} />
                    Save
                  </button>
                  <button type="button" className="right-settings-action" onClick={() => loadLayoutSnapshot()}>
                    <Upload size={12} strokeWidth={1.8} />
                    Load
                  </button>
                  <button type="button" className="right-settings-action" onClick={() => resetLayout()}>
                    <RefreshCw size={12} strokeWidth={1.8} />
                    Reset
                  </button>
                  <button type="button" className="right-settings-action" onClick={() => persistImport(exportLayout())}>
                    <Download size={12} strokeWidth={1.8} />
                    Export
                  </button>
                </div>
                <textarea
                  className="right-settings-import"
                  value={importValue}
                  onChange={(e) => persistImport(e.target.value)}
                  placeholder="Paste exported layout JSON here"
                  rows={5}
                />
                <button type="button" className="right-settings-action" onClick={handleImport}>
                  <Upload size={12} strokeWidth={1.8} />
                  Import
                </button>
              </div>
            )}
          </section>

          <section className="right-settings-section">
            <button type="button" className="right-settings-section-head" onClick={() => toggleSection("companion")}>
              <span>Companion Settings</span>
              <span>{activeSections.companion ? "−" : "+"}</span>
            </button>
            {activeSections.companion && (
              <div className="right-settings-grid">
                <label className="right-settings-field">
                  <span>Companion Width</span>
                  <input type="number" min={280} max={560} value={layout.grid.companionWidth} onChange={(e) => setGridConfig({ companionWidth: Number(e.target.value) })} />
                </label>
                <button type="button" className="right-settings-action" onClick={() => window.dispatchEvent(new CustomEvent("nutmag-open-assistant"))}>
                  <Layers3 size={12} strokeWidth={1.8} />
                  Open Assistant
                </button>
                <button type="button" className="right-settings-action" onClick={() => persistCollapsed(true)}>
                  <X size={12} strokeWidth={1.8} />
                  Collapse Panel
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </aside>
  );
}
