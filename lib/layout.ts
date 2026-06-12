// Shared layout store — which widgets live in which column, in what order.
// Mirrors the lib/theme.ts external-store pattern: server renders the
// default arrangement, the client lazily reads the saved one from
// localStorage["nutmag-layout"] (written when the layout is locked in).

import { DEFAULT_LAYOUT, WIDGETS, type LayoutState, type WidgetId } from "@/config/widgets";

const STORAGE_KEY = "nutmag-layout";
const listeners = new Set<() => void>();

let layout: LayoutState | null = null;

/* a stored layout may predate widgets added since (or contain ids that no
   longer exist) — keep what's valid, send everything else to its default
   column so no widget can ever disappear */
function sanitize(raw: unknown): LayoutState | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const stored = raw as Record<string, unknown>;
  const seen = new Set<WidgetId>();
  const result: LayoutState = {};

  for (const colId of Object.keys(DEFAULT_LAYOUT)) {
    const ids = Array.isArray(stored[colId]) ? stored[colId] : [];
    result[colId] = ids.filter(
      (id): id is WidgetId => typeof id === "string" && id in WIDGETS && !seen.has(id as WidgetId),
    );
    for (const id of result[colId]) seen.add(id);
  }

  for (const [colId, ids] of Object.entries(DEFAULT_LAYOUT)) {
    for (const id of ids) {
      if (!seen.has(id)) result[colId].push(id);
    }
  }

  return result;
}

export function getLayout(): LayoutState {
  if (layout === null) {
    layout = DEFAULT_LAYOUT;
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
  return DEFAULT_LAYOUT;
}

export function setLayout(update: LayoutState | ((prev: LayoutState) => LayoutState)) {
  layout = typeof update === "function" ? update(getLayout()) : update;
  listeners.forEach((listener) => listener());
}

/** persist the current arrangement — called when the layout is locked in */
export function persistLayout() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getLayout()));
  } catch {
    // storage full/blocked — layout still applies for this session
  }
}

export function resetLayout() {
  layout = DEFAULT_LAYOUT;
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
