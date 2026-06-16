"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import {
  DndContext,
  DragOverlay,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { Grid2x2Plus, GripHorizontal, Minus, Plus, Settings2 } from "lucide-react";
import {
  SPAN_MAP,
  WIDGETS,
  type ChannelRegion,
  type Orientation,
  type WidgetId,
  type WidgetManifest,
  type WidgetSize,
} from "@/config/widgets";
import type { WidgetInstance } from "@/lib/layout";
import { useGridColumns } from "@/lib/useGridColumns";
import { useLayout } from "@/components/LayoutProvider";
import { WidgetShell, type ShellConfig } from "@/components/framework/WidgetShell";
import { WidgetSettingsPopover } from "@/components/framework/WidgetSettingsPopover";
import { BottomCompanion } from "@/components/BottomCompanion";

const CHANNEL_REGIONS: ChannelRegion[] = ["left", "center", "right"];
const HERO_WIDGETS = new Set<WidgetId>(["identity", "now-playing", "currently-playing", "github"]);

function spanStyle(instance: WidgetInstance, gridCols: number) {
  const [cols, rows] = SPAN_MAP[`${instance.size}-${instance.orientation}`];
  return {
    gridColumn: `span ${Math.min(cols, gridCols)}`,
    gridRow: gridCols === 1 ? undefined : `span ${rows}`,
  };
}

function pickAllowed<T>(allowed: readonly T[], preferred: readonly T[], fallback: T): T {
  for (const value of preferred) {
    if (allowed.includes(value)) return value;
  }
  return fallback;
}

function autoChannelConfig(
  instance: WidgetInstance,
  manifest: WidgetManifest,
  columns: number,
  rows: number,
  count: number,
): ShellConfig {
  const preferredSizes: WidgetSize[] =
    columns === 1 ? (count <= 2 ? ["L", "M", "S"] : count <= 4 ? ["M", "S", "L"] : ["S", "M", "L"]) : ["S", "M", "L"];
  const preferredOrientations: Orientation[] = columns === 1 ? ["h", "v"] : ["v", "h"];

  return {
    ...instance,
    size: pickAllowed(manifest.sizes, preferredSizes, instance.size),
    orientation: pickAllowed(manifest.orientations, preferredOrientations, instance.orientation),
    expand: rows >= 5 || columns >= 2 ? (manifest.expandedComponent ? "overlay" : "none") : instance.expand,
  };
}

function WidgetFrame({
  instance,
  editMode,
  className = "",
  style,
  dragControls,
  config,
}: {
  instance: WidgetInstance;
  editMode: boolean;
  className?: string;
  style?: CSSProperties;
  dragControls?: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  };
  config?: ShellConfig;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const showSettings = editMode && settingsOpen;

  return (
    <div className={className} style={style}>
      {editMode && (
        <>
          {dragControls && (
            <button
              type="button"
              className="drag-handle"
              aria-label={`move ${instance.id} widget`}
              {...dragControls.attributes}
              {...dragControls.listeners}
            >
              <GripHorizontal size={12} strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            className="gear-btn"
            aria-label={`configure ${instance.id} widget`}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings2 size={12} strokeWidth={1.75} />
          </button>
          {showSettings && (
            <WidgetSettingsPopover
              manifest={WIDGETS[instance.id]}
              instance={instance}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </>
      )}
      <WidgetShell manifest={WIDGETS[instance.id]} config={config ?? instance} />
    </div>
  );
}

function GridWidget({
  instance,
  editMode,
  gridCols,
}: {
  instance: WidgetInstance;
  editMode: boolean;
  gridCols: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: instance.id,
    disabled: !editMode,
  });

  return (
    <div
      ref={setNodeRef}
      className={`widget-slot${editMode ? " editing" : ""}${isDragging ? " dragging" : ""}`}
      style={spanStyle(instance, gridCols)}
    >
      <WidgetFrame instance={instance} editMode={editMode} dragControls={{ attributes, listeners }} />
    </div>
  );
}

function ChannelWidget({
  instance,
  editMode,
  regionCols,
  regionRows,
  count,
}: {
  instance: WidgetInstance;
  editMode: boolean;
  regionCols: number;
  regionRows: number;
  count: number;
}) {
  const manifest = WIDGETS[instance.id];
  const config = autoChannelConfig(instance, manifest, regionCols, regionRows, count);

  return (
    <WidgetFrame
      instance={instance}
      editMode={editMode}
      config={config}
      className={`widget-slot channel-widget${editMode ? " editing" : ""}${HERO_WIDGETS.has(instance.id) ? " hero" : ""}`}
    />
  );
}

function GridDashboard() {
  const { layout, reorderWidget, editMode } = useLayout();
  const gridCols = useGridColumns();
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const lastOverPair = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visible = layout.widgets.filter((w) => !w.hidden);
  const activeInstance = activeId ? visible.find((w) => w.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as WidgetId);
    lastOverPair.current = null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const pairKey = `${active.id}:${over.id}`;
    if (lastOverPair.current === pairKey) return;
    lastOverPair.current = pairKey;
    reorderWidget(active.id as WidgetId, over.id as WidgetId);
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={() => setActiveId(null)}
        onDragCancel={() => setActiveId(null)}
      >
        <div className={`mx-auto max-w-[1800px] px-5 py-6${editMode ? " layout-editing" : ""}`}>
          <div className="frame">
            <div className="frame-inner">
              <SortableContext items={visible.map((w) => w.id)} strategy={() => null}>
                <div className="widget-grid">
                  {visible.map((instance) => (
                    <GridWidget key={instance.id} instance={instance} editMode={editMode} gridCols={gridCols} />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>
        </div>
        <DragOverlay dropAnimation={null}>
          {activeInstance && (
            <div className="widget-slot drag-preview">
              <WidgetShell manifest={WIDGETS[activeInstance.id]} config={activeInstance} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <BottomCompanion />
    </>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="channel-stepper">
      <span>{label}</span>
      <div className="channel-stepper-controls">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label={`decrease ${label}`}>
          <Minus size={12} strokeWidth={1.75} />
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} aria-label={`increase ${label}`}>
          <Plus size={12} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function ChannelGridControls() {
  const { layout, setChannelGrid } = useLayout();
  const [open, setOpen] = useState(false);

  return (
    <div className={`channel-layout-panel${open ? " open" : ""}`}>
      <button
        type="button"
        className="channel-layout-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label="change channel grid layout"
      >
        <Grid2x2Plus size={14} strokeWidth={1.75} />
        grid layout
      </button>

      {open && (
        <div className="channel-layout-popover">
          {CHANNEL_REGIONS.map((region) => (
            <section key={region} className="channel-layout-section">
              <div className="channel-layout-title">{region} grid</div>
              <Stepper
                label="rows"
                value={layout.channels[region].rows}
                min={1}
                max={12}
                onChange={(rows) => setChannelGrid(region, { rows })}
              />
              <Stepper
                label="cols"
                value={layout.channels[region].columns}
                min={1}
                max={3}
                onChange={(columns) => setChannelGrid(region, { columns })}
              />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyChannelSlot({
  region,
  editMode,
}: {
  region: ChannelRegion;
  editMode: boolean;
}) {
  const { layout, revealWidgetInRegion } = useLayout();
  const [open, setOpen] = useState(false);
  const hiddenWidgets = useMemo(() => layout.widgets.filter((widget) => widget.hidden), [layout.widgets]);

  if (!editMode) {
    return <div className="channel-empty-slot">empty slot</div>;
  }

  return (
    <div className={`channel-empty-slot editable${open ? " open" : ""}`}>
      <button
        type="button"
        className="channel-empty-slot-btn"
        onClick={() => setOpen((current) => !current)}
        aria-label={`add widget to ${region} grid`}
      >
        <Plus size={14} strokeWidth={1.75} />
        add widget
      </button>

      {open && (
        <div className="channel-add-menu">
          {hiddenWidgets.length === 0 ? (
            <div className="channel-add-empty">no hidden widgets left</div>
          ) : (
            hiddenWidgets.map((widget) => {
              const manifest = WIDGETS[widget.id];
              const Icon = manifest.icon;
              return (
                <button
                  key={widget.id}
                  type="button"
                  className="channel-add-item"
                  onClick={() => {
                    revealWidgetInRegion(widget.id, region);
                    setOpen(false);
                  }}
                >
                  <Icon size={13} strokeWidth={1.75} />
                  {manifest.title}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ChannelDashboard() {
  const { layout, editMode } = useLayout();
  const companionBoundsRef = useRef<HTMLDivElement | null>(null);

  const regionWidgets = useMemo(() => {
    const grouped: Record<ChannelRegion, WidgetInstance[]> = { left: [], center: [], right: [] };
    for (const instance of layout.widgets.filter((widget) => !widget.hidden)) {
      grouped[instance.channelRegion].push(instance);
    }
    return grouped;
  }, [layout.widgets]);

  return (
    <div className={`mx-auto max-w-[1800px] px-5 py-6${editMode ? " layout-editing" : ""}`}>
      <div className="frame frame-channels">
        <div className="frame-inner frame-inner-channels">
          <ChannelGridControls />

          <div className="channel-shell">
            {CHANNEL_REGIONS.map((region) => {
              const config = layout.channels[region];
              const widgets = regionWidgets[region];
              const capacity = config.rows * config.columns;
              const slotCount = Math.max(capacity, widgets.length);
              const visualRows = Math.max(config.rows, Math.ceil(slotCount / config.columns));
              const emptyCount = Math.max(0, slotCount - widgets.length);

              return (
                <section key={region} className={`channel-column channel-column-${region}`}>
                  <div
                    className="channel-grid"
                    style={
                      {
                        "--channel-columns": config.columns,
                        "--channel-rows": visualRows,
                      } as CSSProperties
                    }
                  >
                    {widgets.map((instance) => (
                      <ChannelWidget
                        key={instance.id}
                        instance={instance}
                        editMode={editMode}
                        regionCols={config.columns}
                        regionRows={visualRows}
                        count={widgets.length}
                      />
                    ))}

                    {Array.from({ length: emptyCount }, (_, index) => (
                      <EmptyChannelSlot key={`${region}-empty-${index}`} region={region} editMode={editMode} />
                    ))}
                  </div>
                </section>
              );
            })}

            <aside className="channel-rail" aria-label="companion rail">
              <div className="channel-rail-card">
                <div className="channel-rail-kicker">companion rail</div>
                <div className="channel-rail-title">cat dock</div>
                <p>The dock stays themed, keeps the cat contained, and gives the layout a fixed companion zone.</p>
                <div className="channel-rail-meta">
                  <span>{layout.widgets.filter((widget) => !widget.hidden).length} live widgets</span>
                  <span>{editMode ? "edit mode" : "locked layout"}</span>
                </div>
                <div ref={companionBoundsRef} className="companion-dock">
                  <div className="companion-dock-grid" aria-hidden />
                  <BottomCompanion docked boundsRef={companionBoundsRef} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { layout } = useLayout();
  return layout.layoutMode === "channels" ? <ChannelDashboard /> : <GridDashboard />;
}
