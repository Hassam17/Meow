"use client";

// Tracks how many columns the dashboard grid currently has, so widget spans
// can be clamped (a 3-wide widget on a 2-column grid renders 2 wide).
// Must stay in sync with the .widget-grid breakpoints in globals.css.

import { useSyncExternalStore } from "react";

const BREAKPOINTS: { minWidth: number; cols: number }[] = [
  { minWidth: 1441, cols: 6 },
  { minWidth: 1024, cols: 4 },
  { minWidth: 641, cols: 2 },
];

function getColumns(): number {
  for (const { minWidth, cols } of BREAKPOINTS) {
    if (window.matchMedia(`(min-width: ${minWidth}px)`).matches) return cols;
  }
  return 1;
}

function subscribe(listener: () => void) {
  const queries = BREAKPOINTS.map(({ minWidth }) => window.matchMedia(`(min-width: ${minWidth}px)`));
  queries.forEach((q) => q.addEventListener("change", listener));
  return () => queries.forEach((q) => q.removeEventListener("change", listener));
}

export function useGridColumns(): number {
  return useSyncExternalStore(subscribe, getColumns, () => 6);
}
