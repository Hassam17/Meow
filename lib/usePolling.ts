"use client";

// Shared polling hook — replaces the fetch + setInterval boilerplate that was
// reimplemented in every widget. Responses are cached per URL in a module-level
// store, so several widgets reading the same endpoint (collapsed card + its
// flyout, or the five homelab-v2 consumers) share one request and one timer.
// Honors prefs.pollingEnabled: when off, each URL is fetched once and the
// timers stop until it's re-enabled.

import { useCallback, useSyncExternalStore } from "react";
import { getPrefs, subscribePrefs } from "@/lib/prefs";

type Entry = {
  data: unknown;
  listeners: Set<() => void>;
  /** interval each active subscriber asked for — the fastest one wins */
  intervals: Map<symbol, number>;
  timer: ReturnType<typeof setInterval> | null;
  fetched: boolean;
};

const entries = new Map<string, Entry>();

function fetchUrl(url: string) {
  fetch(url)
    .then((r) => r.json())
    .then((data) => {
      const entry = entries.get(url);
      if (!entry) return;
      entry.data = data;
      entry.listeners.forEach((listener) => listener());
    })
    .catch(() => {});
}

function syncTimer(url: string) {
  const entry = entries.get(url);
  if (!entry) return;
  if (entry.timer) {
    clearInterval(entry.timer);
    entry.timer = null;
  }
  if (entry.listeners.size === 0) {
    entries.delete(url);
    return;
  }
  if (!getPrefs().pollingEnabled) return;
  const interval = Math.min(...entry.intervals.values());
  entry.timer = setInterval(() => fetchUrl(url), interval);
}

let prefsHooked = false;
function hookPrefs() {
  if (prefsHooked) return;
  prefsHooked = true;
  subscribePrefs(() => {
    for (const url of entries.keys()) syncTimer(url);
  });
}

export function usePolling<T>(url: string, intervalMs = 60_000): { data: T | null; refresh: () => void } {
  const subscribe = useCallback(
    (listener: () => void) => {
      hookPrefs();
      let entry = entries.get(url);
      if (!entry) {
        entry = { data: null, listeners: new Set(), intervals: new Map(), timer: null, fetched: false };
        entries.set(url, entry);
      }
      const key = Symbol();
      entry.listeners.add(listener);
      entry.intervals.set(key, intervalMs);
      if (!entry.fetched) {
        entry.fetched = true;
        fetchUrl(url);
      }
      syncTimer(url);
      return () => {
        const current = entries.get(url);
        if (!current) return;
        current.listeners.delete(listener);
        current.intervals.delete(key);
        syncTimer(url);
      };
    },
    [url, intervalMs],
  );

  const data = useSyncExternalStore(
    subscribe,
    () => (entries.get(url)?.data ?? null) as T | null,
    () => null,
  );

  const refresh = useCallback(() => fetchUrl(url), [url]);

  return { data, refresh };
}
