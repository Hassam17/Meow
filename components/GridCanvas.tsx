"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripHorizontal, GripVertical, Settings2, X } from "lucide-react";
import { WIDGETS, type WidgetId } from "@/config/widgets";
import { widgetRegistry } from "@/widgets/registry";
import { useLayout } from "@/components/LayoutProvider";
import { WidgetShell } from "@/components/framework/WidgetShell";
import { WidgetSettingsPopover } from "@/components/framework/WidgetSettingsPopover";
import { canPlace, createOccupancyMatrix, sizeForWidget, type GridPlacement } from "@/lib/gridEngine";

type DragMode = "move" | "resize";
type ResizeAnchor = "top-left" | "top-right" | "bottom-left" | "bottom-right";

type InteractionState = {
  id: WidgetId;
  mode: DragMode;
  anchor?: ResizeAnchor;
  pointerX: number;
  pointerY: number;
  start: GridPlacement;
  preview: GridPlacement;
  valid: boolean;
};

const REGISTRY = new Map(widgetRegistry.map((entry) => [entry.id, entry] as const));

function clampRect(rect: GridPlacement, columns: number, rows: number) {
  const width = Math.max(1, Math.min(columns, Math.round(rect.width)));
  const height = Math.max(1, Math.min(rows, Math.round(rect.height)));
  return {
    x: Math.max(0, Math.min(columns - width, Math.round(rect.x))),
    y: Math.max(0, Math.min(rows - height, Math.round(rect.y))),
    width,
    height,
  };
}

function previewFromMove(start: GridPlacement, dx: number, dy: number, columns: number, rows: number) {
  return clampRect({ ...start, x: start.x + dx, y: start.y + dy }, columns, rows);
}

function previewFromResize(start: GridPlacement, dx: number, dy: number, anchor: ResizeAnchor, columns: number, rows: number) {
  let x = start.x;
  let y = start.y;
  let width = start.width;
  let height = start.height;

  if (anchor === "bottom-right") {
    width = start.width + dx;
    height = start.height + dy;
  }
  if (anchor === "bottom-left") {
    x = start.x + dx;
    width = start.width - dx;
    height = start.height + dy;
  }
  if (anchor === "top-right") {
    y = start.y + dy;
    width = start.width + dx;
    height = start.height - dy;
  }
  if (anchor === "top-left") {
    x = start.x + dx;
    y = start.y + dy;
    width = start.width - dx;
    height = start.height - dy;
  }

  return clampRect({ x, y, width: Math.max(1, width), height: Math.max(1, height) }, columns, rows);
}

function readMetrics(node: HTMLElement | null) {
  if (!node) return { cellWidth: 120, rowHeight: 128, gap: 16 };
  const style = getComputedStyle(node);
  const gap = parseFloat(style.getPropertyValue("--grid-gap")) || 16;
  const padding = parseFloat(style.getPropertyValue("--grid-padding")) || 0;
  const rowHeight = parseFloat(style.getPropertyValue("--grid-row-height")) || 128;
  const columns = Number(style.getPropertyValue("--grid-columns")) || 12;
  const width = node.getBoundingClientRect().width;
  const cellWidth = (width - padding * 2 - gap * (columns - 1)) / Math.max(1, columns);
  return { cellWidth, rowHeight, gap };
}

export function GridCanvas() {
  const { layout, editMode, moveWidgetPlacement, resizeWidgetPlacement, placeWidgetPlacement, setGridDebug } = useLayout();
  const gridRef = useRef<HTMLDivElement>(null);
  const [settingsOpen, setSettingsOpen] = useState<WidgetId | null>(null);
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [metrics, setMetrics] = useState({ cellWidth: 120, rowHeight: 128, gap: layout.grid.gap });

  const visible = useMemo(() => {
    return layout.widgets
      .filter((widget) => !widget.hidden && layout.placements[widget.id] && REGISTRY.has(widget.id))
      .sort((a, b) => {
        const pa = layout.placements[a.id];
        const pb = layout.placements[b.id];
        if (pa.y !== pb.y) return pa.y - pb.y;
        if (pa.x !== pb.x) return pa.x - pb.x;
        return layout.widgets.findIndex((widget) => widget.id === a.id) - layout.widgets.findIndex((widget) => widget.id === b.id);
      });
  }, [layout.placements, layout.widgets]);

  const occupancy = useMemo(() => createOccupancyMatrix(layout.grid, layout.placements), [layout.grid, layout.placements]);
  const rows = Math.max(layout.grid.rows, ...Object.values(layout.placements).map((placement) => placement.y + placement.height), 1);
  const columns = Math.max(layout.grid.columns, 1);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    setMetrics(readMetrics(node));
  }, [layout.grid.columns, layout.grid.gap, rows, visible.length]);

  useEffect(() => {
    const node = gridRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setMetrics(readMetrics(node)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!interaction) return;
    const activeInteraction = interaction;

    function onMove(event: PointerEvent) {
      const deltaX = event.clientX - activeInteraction.pointerX;
      const deltaY = event.clientY - activeInteraction.pointerY;
      const dx = Math.round(deltaX / Math.max(1, metrics.cellWidth + metrics.gap));
      const dy = Math.round(deltaY / Math.max(1, metrics.rowHeight + metrics.gap));
      const preview =
        activeInteraction.mode === "move"
          ? previewFromMove(activeInteraction.start, dx, dy, columns, rows)
          : previewFromResize(activeInteraction.start, dx, dy, activeInteraction.anchor ?? "bottom-right", columns, rows);
      const valid = canPlace(layout.grid, layout.placements, activeInteraction.id, preview);
      setInteraction((current) => (current ? { ...current, preview, valid } : current));
      event.preventDefault();
    }

    function onUp() {
      setInteraction((current) => {
        if (!current) return current;
        if (current.mode === "move") {
          moveWidgetPlacement(current.id, { x: current.preview.x, y: current.preview.y });
        } else {
          resizeWidgetPlacement(current.id, { width: current.preview.width, height: current.preview.height }, current.anchor);
        }
        return null;
      });
    }

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [columns, interaction, layout.grid, layout.placements, metrics.cellWidth, metrics.gap, metrics.rowHeight, moveWidgetPlacement, resizeWidgetPlacement, rows]);

  function beginMove(id: WidgetId, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!editMode) return;
    const current = layout.placements[id];
    if (!current) return;
    event.preventDefault();
    event.stopPropagation();
    setInteraction({
      id,
      mode: "move",
      pointerX: event.clientX,
      pointerY: event.clientY,
      start: current,
      preview: current,
      valid: true,
    });
  }

  function beginResize(id: WidgetId, anchor: ResizeAnchor, event: ReactPointerEvent<HTMLButtonElement>) {
    if (!editMode) return;
    const current = layout.placements[id];
    if (!current) return;
    event.preventDefault();
    event.stopPropagation();
    setInteraction({
      id,
      mode: "resize",
      anchor,
      pointerX: event.clientX,
      pointerY: event.clientY,
      start: current,
      preview: current,
      valid: true,
    });
  }

  function resetWidget(id: WidgetId) {
    const entry = REGISTRY.get(id);
    if (!entry) return;
    placeWidgetPlacement(id, { x: 0, y: 0, width: entry.width, height: entry.height });
  }

  function widgetStyle(placement: GridPlacement, index: number, dragging: boolean, valid: boolean): CSSProperties {
    return {
      gridColumn: `${placement.x + 1} / span ${placement.width}`,
      gridRow: `${placement.y + 1} / span ${placement.height}`,
      zIndex: dragging ? 20 : index + 1,
      opacity: dragging ? 0.22 : 1,
      outline: dragging ? `1px solid ${valid ? "color-mix(in srgb, var(--color-primary) 45%, transparent)" : "rgba(239, 68, 68, 0.8)"}` : undefined,
    };
  }

  return (
    <section className={`grid-canvas${layout.grid.debug ? " debug" : ""}${editMode ? " editing" : ""}`}>
      <div className="grid-canvas-head">
        <div>
          <div className="grid-canvas-kicker">Grid Engine</div>
          <div className="grid-canvas-title">
            {layout.grid.columns} columns · {layout.grid.rows} rows · gap {layout.grid.gap}px
          </div>
        </div>
        <div className="grid-canvas-actions">
          <button type="button" className={`grid-pill${layout.grid.debug ? " active" : ""}`} onClick={() => setGridDebug(!layout.grid.debug)}>
            Debug
          </button>
        </div>
      </div>

      <div
        ref={gridRef}
        className="grid-board"
        style={
          {
            ["--grid-columns" as never]: columns,
            ["--grid-rows" as never]: rows,
            ["--grid-gap" as never]: `${layout.grid.gap}px`,
            ["--grid-padding" as never]: `${layout.grid.padding}px`,
            ["--grid-row-height" as never]: `${metrics.rowHeight}px`,
          } as CSSProperties
        }
      >
        {layout.grid.debug && (
          <div className="grid-debug-layer" aria-hidden="true">
            {Array.from({ length: rows }).map((_, row) =>
              Array.from({ length: columns }).map((__, column) => (
                <div key={`${row}-${column}`} className={`grid-debug-cell${occupancy[row]?.[column] ? " occupied" : ""}`}>
                  <span>{column + 1}:{row + 1}</span>
                </div>
              )),
            )}
          </div>
        )}

        <AnimatePresence initial={false}>
          {visible.map((widget, index) => {
            const placement = layout.placements[widget.id];
            const manifest = WIDGETS[widget.id];
            const active = interaction?.id === widget.id;
            const valid = interaction?.id === widget.id ? interaction.valid : true;
            const preview = active && interaction ? interaction.preview : placement;
            const label = sizeForWidget(preview.width, preview.height) ?? `${preview.width}x${preview.height}`;

            return (
              <motion.article
                key={widget.id}
                className={`grid-widget${active ? " dragging" : ""}${valid ? "" : " invalid"}`}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                style={widgetStyle(preview, index, active, valid)}
              >
                <div className="grid-widget-shell">
                  {editMode && (
                    <div className="grid-widget-toolbar">
                      <button type="button" className="grid-widget-handle" onPointerDown={(event) => beginMove(widget.id, event)} aria-label={`move ${widget.id}`}>
                        <GripHorizontal size={12} strokeWidth={1.8} />
                      </button>
                      <button type="button" className="grid-widget-gear" onClick={() => setSettingsOpen((current) => (current === widget.id ? null : widget.id))} aria-label={`widget settings ${widget.id}`}>
                        <Settings2 size={12} strokeWidth={1.8} />
                      </button>
                      <button type="button" className="grid-widget-reset" onClick={() => resetWidget(widget.id)} aria-label={`reset ${widget.id}`}>
                        <X size={11} strokeWidth={1.8} />
                      </button>
                    </div>
                  )}

                  <WidgetShell manifest={manifest} config={widget} />

                  {editMode && (
                    <div className="grid-widget-resize">
                      <button type="button" className="resize-handle tl" onPointerDown={(event) => beginResize(widget.id, "top-left", event)} aria-label={`resize ${widget.id} top left`}>
                        <GripVertical size={10} strokeWidth={1.8} />
                      </button>
                      <button type="button" className="resize-handle tr" onPointerDown={(event) => beginResize(widget.id, "top-right", event)} aria-label={`resize ${widget.id} top right`}>
                        <GripVertical size={10} strokeWidth={1.8} />
                      </button>
                      <button type="button" className="resize-handle bl" onPointerDown={(event) => beginResize(widget.id, "bottom-left", event)} aria-label={`resize ${widget.id} bottom left`}>
                        <GripVertical size={10} strokeWidth={1.8} />
                      </button>
                      <button type="button" className="resize-handle br" onPointerDown={(event) => beginResize(widget.id, "bottom-right", event)} aria-label={`resize ${widget.id} bottom right`}>
                        <GripVertical size={10} strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                </div>

                {editMode && (
                  <div className="grid-widget-meta">
                    <span>{label}</span>
                    <span>{preview.width}x{preview.height}</span>
                  </div>
                )}

                {settingsOpen === widget.id && manifest && (
                  <WidgetSettingsPopover manifest={manifest} instance={widget} onClose={() => setSettingsOpen(null)} />
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>

        {interaction && interaction.mode === "resize" && (
          <div
            className={`grid-preview${interaction.valid ? "" : " invalid"}`}
            style={{
              gridColumn: `${interaction.preview.x + 1} / span ${interaction.preview.width}`,
              gridRow: `${interaction.preview.y + 1} / span ${interaction.preview.height}`,
            }}
          />
        )}
      </div>
    </section>
  );
}
