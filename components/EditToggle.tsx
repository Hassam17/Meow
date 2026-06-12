"use client";

import { Lock, RotateCcw, Wrench } from "lucide-react";
import { useLayout } from "@/components/LayoutProvider";

export function EditToggle() {
  const { editMode, startEdit, lockLayout, resetLayout } = useLayout();

  return (
    <>
      {editMode && (
        <button
          type="button"
          className="theme-toggle"
          onClick={resetLayout}
          aria-label="reset layout to default"
          title="reset layout"
        >
          <RotateCcw size={12} strokeWidth={1.75} />
        </button>
      )}
      <button
        type="button"
        className={`theme-toggle${editMode ? " edit-active" : ""}`}
        onClick={editMode ? lockLayout : startEdit}
        aria-label={editMode ? "lock layout" : "rearrange widgets"}
        title={editMode ? "lock layout" : "rearrange widgets"}
      >
        {editMode ? <Lock size={12} strokeWidth={1.75} /> : <Wrench size={12} strokeWidth={1.75} />}
      </button>
    </>
  );
}
