"use client";

import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import type { LayoutState } from "@/config/widgets";
import {
  getLayout,
  getServerLayout,
  persistLayout,
  resetLayout as resetLayoutStore,
  setLayout,
  subscribeLayout,
} from "@/lib/layout";

type LayoutContextValue = {
  layout: LayoutState;
  setLayout: typeof setLayout;
  editMode: boolean;
  startEdit: () => void;
  /** persist the current arrangement and exit edit mode */
  lockLayout: () => void;
  /** restore the default arrangement and clear the saved one */
  resetLayout: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const layout = useSyncExternalStore(subscribeLayout, getLayout, getServerLayout);
  const [editMode, setEditMode] = useState(false);

  const startEdit = useCallback(() => setEditMode(true), []);

  const lockLayout = useCallback(() => {
    persistLayout();
    setEditMode(false);
  }, []);

  return (
    <LayoutContext.Provider
      value={{ layout, setLayout, editMode, startEdit, lockLayout, resetLayout: resetLayoutStore }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout must be used inside <LayoutProvider>");
  return ctx;
}
