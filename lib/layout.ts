// Shared layout store — a single ordered list of widget instances, each
// carrying its grid placement config (size, orientation, expansion) and
// widget-specific settings. Mirrors the lib/theme.ts external-store pattern:
// the server renders the defaults, the client lazily reads the saved state
// from localStorage["nutmag-layout"]. Every mutation persists immediately.

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
  version: 5;
  layoutMode: LayoutMode;
  preset: LayoutPreset;
  channels: ChannelLayout;
  /** list order = grid placement order (dense auto-flow back-fills gaps) */
  widgets: WidgetInstance[];
};

const STORAGE_KEY = "nutmag-layout";
const listeners = new Set<() => void>();
const REMOVED_WIDGETS = new Set<WidgetId>(["homelab", "jellyfin"]);

/* widgets the user must never lose access to (the framework's own controls
   live here once the hub-settings widget exists) */
const ALWAYS_VISIBLE: string[] = ["hub-settings"];

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
    defaultLayout = {
      version: 5,
      layoutMode: defaultLayoutMode(),
      preset: "productivity",
      channels: defaultChannels(),
      widgets: DEFAULT_ORDER.map(defaultInstance),
    };
  }
  return defaultLayout;
}

/* v1 layouts were Record<columnId, widgetId[]>; flatten them in the old
   visual column order and expand the ids of the dissolved pair wrappers */
const V1_COLUMN_ORDER = ["left", "services", "center", "tracker"];
const V1_PAIR_IDS: Record<string, WidgetId[]> = {
  media: ["now-playing", "currently-playing"],
  "disk-network": ["disk-storage", "network-stats"],
};

function migrateV1(stored: Record<string, unknown>): WidgetId[] {
  const order: WidgetId[] = [];
  const keys = [...V1_COLUMN_ORDER, ...Object.keys(stored).filter((k) => !V1_COLUMN_ORDER.includes(k))];
  for (const key of keys) {
    const ids = stored[key];
    if (!Array.isArray(ids)) continue;
    for (const raw of ids) {
      if (typeof raw !== "string") continue;
      const expanded = V1_PAIR_IDS[raw] ?? (raw in WIDGETS ? [raw as WidgetId] : []);
      for (const id of expanded) {
        if (!order.includes(id)) order.push(id);
      }
    }
  }
  return order;
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

/* a stored layout may predate widgets added since (or contain ids/values
   that no longer exist) — keep what's valid, fall back per-field to the
   manifest defaults, and append missing widgets so none can ever disappear */
function sanitize(raw: unknown): LayoutState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const stored = raw as Record<string, unknown>;

  const seen = new Set<WidgetId>();
  const widgets: WidgetInstance[] = [];

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

  if ((stored.version === 2 || stored.version === 3 || stored.version === 4 || stored.version === 5) && Array.isArray(stored.widgets)) {
    for (const item of stored.widgets) {
      if (!item || typeof item !== "object") continue;
      const id = (item as Record<string, unknown>).id;
      if (typeof id === "string" && id in WIDGETS) push(id as WidgetId, item as Record<string, unknown>);
    }
  } else if (stored.version === undefined) {
    for (const id of migrateV1(stored)) push(id);
  } else {
    return null;
  }

  // anything registered since the layout was saved joins at the end
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) push(id);
  }

  return {
    version: 5,
    layoutMode: sanitizeLayoutMode(stored.layoutMode),
    preset: sanitizeLayoutPreset(stored.preset),
    channels: sanitizeChannels(stored.channels),
    widgets,
  };
}

export function getLayout(): LayoutState {
  if (layout === null) {
    layout = buildDefaultLayout();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cleaned = sanitize(JSON.parse(raw));
        if (cleaned) layout = cleaned;
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

/** move `activeId` to `overId`'s position (dnd live reorder) */
export function reorderWidget(activeId: WidgetId, overId: WidgetId) {
  const current = getLayout();
  const from = current.widgets.findIndex((w) => w.id === activeId);
  const to = current.widgets.findIndex((w) => w.id === overId);
  if (from === -1 || to === -1 || from === to) return;
  const widgets = [...current.widgets];
  const [moved] = widgets.splice(from, 1);
  widgets.splice(to, 0, moved);
  commit({ version: 5, layoutMode: current.layoutMode, preset: current.preset, channels: current.channels, widgets });
}

export function updateInstance(id: WidgetId, patch: Partial<Omit<WidgetInstance, "id">>) {
  const current = getLayout();
  commit({
    version: 5,
    layoutMode: current.layoutMode,
    preset: current.preset,
    channels: current.channels,
    widgets: current.widgets.map((w) =>
      w.id === id ? { ...w, ...patch, settings: { ...w.settings, ...patch.settings } } : w,
    ),
  });
}

export function setLayoutMode(layoutMode: LayoutMode) {
  const current = getLayout();
  if (current.layoutMode === layoutMode) return;
  commit({ version: 5, layoutMode, preset: current.preset, channels: current.channels, widgets: current.widgets });
}

export function setChannelGrid(region: ChannelRegion, patch: Partial<ChannelGridConfig>) {
  const current = getLayout();
  const existing = current.channels[region];
  commit({
    version: 5,
    layoutMode: current.layoutMode,
    preset: current.preset,
    channels: {
      ...current.channels,
      [region]: {
        rows: sanitizeChannelValue(patch.rows ?? existing.rows, existing.rows, 12),
        columns: sanitizeChannelValue(patch.columns ?? existing.columns, existing.columns, 3),
      },
    },
    widgets: current.widgets,
  });
}

export function revealWidgetInRegion(id: WidgetId, region: ChannelRegion) {
  updateInstance(id, { hidden: false, channelRegion: region });
}

export function setLayoutPreset(preset: LayoutPreset) {
  const current = getLayout();
  const order = PRESET_ORDERS[preset];
  const widgets = [
    ...order.map((id) => current.widgets.find((widget) => widget.id === id)).filter(Boolean) as WidgetInstance[],
    ...current.widgets.filter((widget) => !order.includes(widget.id)),
  ];
  commit({
    version: 5,
    layoutMode: "grid",
    preset,
    channels: current.channels,
    widgets,
  });
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
