"use client";

// The widget framework's card shell. Given a manifest (and optionally a
// per-instance config), it renders the sticker/stamp chrome, the label
// header, and the expansion machinery — widget content components only
// render their data and read placement state through useWidget().

import { useRef, useState, type MouseEvent, type KeyboardEvent } from "react";
import {
  resolveSettings,
  type ExpandDirection,
  type ExpandMode,
  type Orientation,
  type SettingsValues,
  type WidgetManifest,
  type WidgetSize,
} from "@/config/widgets";
import { WidgetContext } from "@/components/framework/WidgetContext";
import { WidgetFlyout } from "@/components/framework/WidgetFlyout";
import { WidgetOverlay } from "@/components/framework/WidgetOverlay";

/** the per-instance slice the shell cares about; missing fields fall back
    to the manifest defaults */
export type ShellConfig = {
  size?: WidgetSize;
  orientation?: Orientation;
  expand?: ExpandMode;
  expandDirection?: ExpandDirection;
  settings?: SettingsValues;
};

const CLOSE_DELAY_MS = 150;

/** clicks on interactive content shouldn't also trigger the overlay */
function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    !!target.closest("button, a, input, select, textarea, [role='button'], [contenteditable]")
  );
}

export function WidgetShell({ manifest, config }: { manifest: WidgetManifest; config?: ShellConfig }) {
  const size = config?.size ?? manifest.defaults.size;
  const orientation = config?.orientation ?? manifest.defaults.orientation;
  const settings = resolveSettings(manifest, config?.settings);
  const expandDirection = config?.expandDirection ?? "down";
  // an expansion mode is only honored when the widget ships expanded content
  const expand: ExpandMode =
    manifest.expandedComponent ? (config?.expand ?? manifest.defaults.expand) : "none";

  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  function hoverEnter() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFlyoutOpen(true);
  }

  function hoverLeave() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setFlyoutOpen(false), CLOSE_DELAY_MS);
  }

  function handleClick(e: MouseEvent) {
    if (expand !== "overlay" || isInteractive(e.target)) return;
    setOverlayOpen(true);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (expand !== "overlay" || e.key !== "Enter" || isInteractive(e.target)) return;
    setOverlayOpen(true);
  }

  const Content = manifest.component;
  const Expanded = manifest.expandedComponent;
  const flags = manifest.flags ?? {};
  const Icon = manifest.icon;

  const ctx = { id: manifest.id, size, orientation, settings, inOverlay: false };
  const expanded = flyoutOpen || overlayOpen;

  const blockClasses = [
    "block",
    flags.accent ? "accent-left" : "",
    flags.className ?? "",
    expand !== "none" ? "block-expandable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      id={manifest.id}
      ref={anchorRef}
      className={`capsule${flyoutOpen ? " open" : ""}`}
      onMouseEnter={expand === "hover" ? hoverEnter : undefined}
      onMouseLeave={expand === "hover" ? hoverLeave : undefined}
      onFocus={expand === "hover" ? hoverEnter : undefined}
      onBlur={expand === "hover" ? hoverLeave : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={expand === "overlay" ? 0 : undefined}
    >
      {flags.plainChrome ? (
        <WidgetContext.Provider value={{ ...ctx, expanded }}>
          <Content />
        </WidgetContext.Provider>
      ) : (
        <div className={blockClasses}>
          {!flags.customHeader && (
            <div className="block-label">
              <Icon size={14} strokeWidth={1.75} />
              {manifest.title}
            </div>
          )}
          <WidgetContext.Provider value={{ ...ctx, expanded }}>
            <Content />
          </WidgetContext.Provider>
        </div>
      )}

      {expand === "hover" && Expanded && (
        <WidgetFlyout
          anchor={anchorRef.current}
          open={flyoutOpen}
          direction={expandDirection}
          onEnter={hoverEnter}
          onLeave={hoverLeave}
        >
          <WidgetContext.Provider value={{ ...ctx, expanded: true }}>
            <Expanded />
          </WidgetContext.Provider>
        </WidgetFlyout>
      )}

      {expand === "overlay" && Expanded && (
        <WidgetOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} title={manifest.title} Icon={Icon}>
          <WidgetContext.Provider value={{ ...ctx, expanded: true, inOverlay: true }}>
            <Expanded />
          </WidgetContext.Provider>
        </WidgetOverlay>
      )}
    </div>
  );
}
