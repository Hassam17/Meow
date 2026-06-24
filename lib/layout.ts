// Shared layout store — widget instances + explicit grid placements.
// The store persists immediately to localStorage["nutmag-layout"], and all
// invalid/corrupt states are sanitized back into a recoverable layout.

import {
  DEFAULT_ORDER,
  WIDGETS,
  resolveSettings,
  type ChannelRegion,
  type ExpandDirection,
  type ExpandMode,
  type Orientation,
  type SettingsValues,
  type WidgetId,
  type WidgetManifest,
  type WidgetSize,
} from "@/config/widgets";
import { widgetRegistry } from "@/widgets/registry";
import {
  autoPlace,
  canPlace,
  DEFAULT_GRID_CONFIG,
  normalizeGridConfig,
  normalizePlacement,
  placeWidget as enginePlaceWidget,
  removeWidget as engineRemoveWidget,
  resizeWidget as engineResizeWidget,
  type GridConfig,
  type GridPlacement,
} from "@/lib/gridEngine";

export type WidgetInstance = {
  id: WidgetId;
  size: WidgetSize;
  orientation: Orientation;
  expand: ExpandMode;
  expandDirection: ExpandDirection;
  channelRegion: ChannelRegion;
  hidden: boolean;
  settings: SettingsValues;
};

export type LayoutMode = "grid" | "channels";
export type LayoutPreset = "productivity" | "football" | "gym" | "development";

export type ChannelGridConfig = {
  rows: number;
  columns: number;
};

export type ChannelLayout = Record<ChannelRegion, ChannelGridConfig>;

export type LayoutState = {
  version: 6;
  layoutMode: LayoutMode;
  preset: LayoutPreset;
  channels: ChannelLayout;
  grid: GridConfig;
  widgets: WidgetInstance[];
  placements: Record<WidgetId, GridPlacement>;
};

const STORAGE_KEY = "nutmag-layout";
const listeners = new Set<() => void>();
const REMOVED_WIDGETS = new Set<WidgetId>(["homelab", "jellyfin"]);
const ALWAYS_VISIBLE: string[] = ["hub-settings"];

const REGISTRY = new Map(widgetRegistry.map((entry) => [entry.id, entry] as const));

let layout: LayoutState | null = null;
let defaultLayout: LayoutState | null = null;

const PRESET_ORDERS: Record<LayoutPreset, WidgetId[]> = {
  productivity: ["identity", "clock", "quicklinks", "github", "now-playing", "server-stats", "disk-storage", "network-stats", "hub-settings"],
  football: ["identity", "football", "tracker", "clock", "quicklinks", "gym", "github", "hub-settings"],
  gym: ["identity", "gym", "tracker", "clock", "quicklinks", "server-stats", "disk-storage", "hub-settings"],
  development: ["identity", "github", "server-stats", "disk-storage", "network-stats", "arr-stack", "storage-apps", "now-playing", "hub-settings"],
};

function defaultLayoutMode(): LayoutMode {
  return "grid";
}

function defaultChannels(): ChannelLayout {
  const counts: Record<ChannelRegion, number> = { left: 0, center: 0, right: 0 };
  for (const id of DEFAULT_ORDER) {
    const region = WIDGETS[id].channelRegion ?? "right";
    counts[region] += 1;
  }
  return {
    left: { rows: Math.max(1, counts.left), columns: 1 },
    center: { rows: Math.max(1, counts.center), columns: 1 },
    right: { rows: Math.max(1, counts.right), columns: 1 },
  };
}

function defaultGrid(): GridConfig {
  return { ...DEFAULT_GRID_CONFIG, rows: 12, columns: 12, gap: 16, debug: false };
}

function defaultPlacementFor(id: WidgetId): GridPlacement {
  const registry = REGISTRY.get(id);
  return {
    x: 0,
    y: 0,
    width: Math.max(1, registry?.width ?? 1),
    height: Math.max(1, registry?.height ?? 1),
  };
}

function buildDefaultPlacements(grid: GridConfig, order: WidgetId[]): Record<WidgetId, GridPlacement> {
  return autoPlace(
    grid,
    order.map((id) => ({ id, size: defaultPlacementFor(id) })),
  ) as Record<WidgetId, GridPlacement>;
}

export function defaultInstance(id: WidgetId): WidgetInstance {
  const manifest = WIDGETS[id];
  const defaults: WidgetManifest["defaults"] = manifest.defaults;
  return {
    id,
    size: defaults.size,
    orientation: defaults.orientation,
    expand: defaults.expand,
    expandDirection: "down",
    channelRegion: manifest.channelRegion ?? "right",
    hidden: defaults.hidden ?? false,
    settings: resolveSettings(manifest),
  };
}

function buildDefaultLayout(): LayoutState {
  if (!defaultLayout) {
    const grid = defaultGrid();
    defaultLayout = {
      version: 6,
      layoutMode: defaultLayoutMode(),
      preset: "productivity",
      channels: defaultChannels(),
      grid,
      widgets: DEFAULT_ORDER.map(defaultInstance),
      placements: buildDefaultPlacements(grid, DEFAULT_ORDER),
    };
  }
  return defaultLayout;
}

function clamp<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function sanitizeLayoutMode(value: unknown): LayoutMode {
  return clamp(value, ["grid", "channels"] as const, defaultLayoutMode());
}

function sanitizeLayoutPreset(value: unknown): LayoutPreset {
  return clamp(value, ["productivity", "football", "gym", "development"] as const, "productivity");
}

function sanitizeChannelValue(value: unknown, fallback: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.min(max, Math.round(value)));
}

function sanitizeChannels(raw: unknown): ChannelLayout {
  const fallback = defaultChannels();
  const stored = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

  function regionConfig(region: ChannelRegion): ChannelGridConfig {
    const item =
      stored[region] && typeof stored[region] === "object" && !Array.isArray(stored[region])
        ? (stored[region] as Record<string, unknown>)
        : {};
    return {
      rows: sanitizeChannelValue(item.rows, fallback[region].rows, 12),
      columns: sanitizeChannelValue(item.columns, fallback[region].columns, 3),
    };
  }

  return {
    left: regionConfig("left"),
    center: regionConfig("center"),
    right: regionConfig("right"),
  };
}

function sanitizeGrid(raw: unknown): GridConfig {
  const fallback = defaultGrid();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
  return normalizeGridConfig(raw as Partial<GridConfig>, fallback);
}

function sanitizeWidgets(raw: unknown): WidgetInstance[] {
  const seen = new Set<WidgetId>();
  const widgets: WidgetInstance[] = [];
  const stored = Array.isArray(raw) ? raw : [];

  function push(id: WidgetId, item?: Record<string, unknown>) {
    if (seen.has(id) || REMOVED_WIDGETS.has(id)) return;
    seen.add(id);
    const manifest = WIDGETS[id];
    const base = defaultInstance(id);
    widgets.push(
      item
        ? {
            id,
            size: clamp(item.size, manifest.sizes, base.size),
            orientation: clamp(item.orientation, manifest.orientations, base.orientation),
            expand: clamp(item.expand, manifest.expandModes, base.expand),
            expandDirection: clamp(item.expandDirection, ["down", "up"] as const, "down"),
            channelRegion: clamp(item.channelRegion, ["left", "center", "right"] as const, base.channelRegion),
            hidden: ALWAYS_VISIBLE.includes(id) ? false : typeof item.hidden === "boolean" ? item.hidden : base.hidden,
            settings: resolveSettings(
              manifest,
              item.settings && typeof item.settings === "object" ? (item.settings as SettingsValues) : undefined,
            ),
          }
        : base,
    );
  }

  if (stored.length > 0) {
    for (const item of stored) {
      if (!item || typeof item !== "object") continue;
      const id = (item as Record<string, unknown>).id;
      if (typeof id === "string" && id in WIDGETS) push(id as WidgetId, item as Record<string, unknown>);
    }
  } else {
    for (const id of DEFAULT_ORDER) push(id);
  }

  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) push(id);
  }

  return widgets;
}

function sanitizePlacements(
  raw: unknown,
  grid: GridConfig,
  widgets: WidgetInstance[],
): Record<WidgetId, GridPlacement> {
  const entries = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const placements: Record<WidgetId, GridPlacement> = {} as Record<WidgetId, GridPlacement>;
  let needsRecovery = false;

  for (const widget of widgets) {
    const stored = entries[widget.id] && typeof entries[widget.id] === "object" ? (entries[widget.id] as Record<string, unknown>) : null;
    const fallback = defaultPlacementFor(widget.id);
    const candidate = normalizePlacement(
      stored && typeof stored.x === "number" && typeof stored.y === "number" && typeof stored.width === "number" && typeof stored.height === "number"
        ? ({ x: stored.x, y: stored.y, width: stored.width, height: stored.height } as GridPlacement)
        : fallback,
      grid,
      fallback,
    );

    if (!canPlace(grid, placements, widget.id, candidate)) {
      needsRecovery = true;
      continue;
    }

    placements[widget.id] = candidate;
  }

  if (needsRecovery || Object.keys(placements).length !== widgets.length) {
    return buildDefaultPlacements(grid, widgets.map((widget) => widget.id));
  }

  return placements;
}

function sanitize(raw: unknown): LayoutState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const stored = raw as Record<string, unknown>;
  const grid = sanitizeGrid(stored.grid);
  const widgets = sanitizeWidgets(stored.widgets);
  const placements = sanitizePlacements(stored.placements, grid, widgets);

  return {
    version: 6,
    layoutMode: sanitizeLayoutMode(stored.layoutMode),
    preset: sanitizeLayoutPreset(stored.preset),
    channels: sanitizeChannels(stored.channels),
    grid,
    widgets,
    placements,
  };
}

export function getLayout(): LayoutState {
  if (layout === null) {
    layout = buildDefaultLayout();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = sanitize(JSON.parse(raw));
        if (parsed) layout = parsed;
      }
    } catch {
      // corrupt saved layout — keep the default
    }
  }
  return layout;
}

export function getServerLayout(): LayoutState {
  return buildDefaultLayout();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // storage full/blocked — layout still applies for this session
  }
}

function commit(next: LayoutState) {
  layout = next;
  persist();
  listeners.forEach((listener) => listener());
}

function currentState() {
  return getLayout();
}

function commitPlacements(placements: Record<WidgetId, GridPlacement>) {
  const current = currentState();
  commit({ ...current, placements });
}

export function reorderWidget(activeId: WidgetId, overId: WidgetId) {
  const current = currentState();
  const from = current.widgets.findIndex((w) => w.id === activeId);
  const to = current.widgets.findIndex((w) => w.id === overId);
  if (from === -1 || to === -1 || from === to) return;
  const widgets = [...current.widgets];
  const [moved] = widgets.splice(from, 1);
  widgets.splice(to, 0, moved);
  commit({ ...current, widgets });
}

export function updateInstance(id: WidgetId, patch: Partial<Omit<WidgetInstance, "id">>) {
  const current = currentState();
  commit({
    ...current,
    widgets: current.widgets.map((w) =>
      w.id === id ? { ...w, ...patch, settings: { ...w.settings, ...patch.settings } } : w,
    ),
  });
}

export function setLayoutMode(layoutMode: LayoutMode) {
  const current = currentState();
  if (current.layoutMode === layoutMode) return;
  commit({ ...current, layoutMode });
}

export function setLayoutPreset(preset: LayoutPreset) {
  const current = currentState();
  const order = PRESET_ORDERS[preset];
  const widgets = [
    ...order.map((id) => current.widgets.find((widget) => widget.id === id)).filter(Boolean) as WidgetInstance[],
    ...current.widgets.filter((widget) => !order.includes(widget.id)),
  ];
  const placements = buildDefaultPlacements(current.grid, widgets.map((widget) => widget.id));
  commit({
    ...current,
    layoutMode: "grid",
    preset,
    widgets,
    placements,
  });
}

export function setChannelGrid(region: ChannelRegion, patch: Partial<ChannelGridConfig>) {
  const current = currentState();
  const existing = current.channels[region];
  commit({
    ...current,
    channels: {
      ...current.channels,
      [region]: {
        rows: sanitizeChannelValue(patch.rows ?? existing.rows, existing.rows, 12),
        columns: sanitizeChannelValue(patch.columns ?? existing.columns, existing.columns, 3),
      },
    },
  });
}

export function setGridConfig(patch: Partial<GridConfig>) {
  const current = currentState();
  const grid = normalizeGridConfig(patch, current.grid);
  const placements = sanitizePlacements(current.placements, grid, current.widgets);
  commit({ ...current, grid, placements });
}

export function setGridDebug(debug: boolean) {
  setGridConfig({ debug });
}

export function placeWidgetPlacement(id: WidgetId, placement: GridPlacement) {
  const current = currentState();
  const outcome = enginePlaceWidget(current.grid, current.placements, id, placement);
  if (outcome.ok) commitPlacements(outcome.placements as Record<WidgetId, GridPlacement>);
  return outcome;
}

export function moveWidgetPlacement(id: WidgetId, position: { x: number; y: number }) {
  const current = currentState();
  const existing = current.placements[id];
  if (!existing) return { ok: false, placements: current.placements, reason: "Missing widget placement" };
  const outcome = enginePlaceWidget(current.grid, current.placements, id, { ...existing, x: position.x, y: position.y });
  if (outcome.ok) commitPlacements(outcome.placements as Record<WidgetId, GridPlacement>);
  return outcome;
}

export function resizeWidgetPlacement(
  id: WidgetId,
  nextSize: { width: number; height: number },
  anchor: "top-left" | "top-right" | "bottom-left" | "bottom-right" = "top-left",
) {
  const current = currentState();
  const outcome = engineResizeWidget(current.grid, current.placements, id, nextSize, anchor);
  if (outcome.ok) commitPlacements(outcome.placements as Record<WidgetId, GridPlacement>);
  return outcome;
}

export function removeWidgetPlacement(id: WidgetId) {
  const current = currentState();
  if (!current.placements[id]) return;
  commitPlacements(engineRemoveWidget(current.placements, id) as Record<WidgetId, GridPlacement>);
}

export function revealWidgetInRegion(id: WidgetId, region: ChannelRegion) {
  updateInstance(id, { hidden: false, channelRegion: region });
}

export function recoverLayout() {
  const current = currentState();
  const recovered = {
    ...current,
    placements: buildDefaultPlacements(current.grid, current.widgets.map((widget) => widget.id)),
  };
  commit(recovered);
}

export function exportLayout() {
  return JSON.stringify(getLayout());
}

export function importLayout(raw: string) {
  const parsed = sanitize(JSON.parse(raw));
  if (!parsed) throw new Error("Invalid layout payload");
  commit(parsed);
}

export function resetLayout() {
  layout = buildDefaultLayout();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener());
}

export function subscribeLayout(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
