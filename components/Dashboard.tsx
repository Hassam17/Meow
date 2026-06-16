"use client";

import { useRef, useState, type CSSProperties } from "react";
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
import { GripHorizontal, Settings2 } from "lucide-react";
import { SPAN_MAP, WIDGETS, type ChannelRegion, type WidgetId } from "@/config/widgets";
import type { WidgetInstance } from "@/lib/layout";
import { useGridColumns } from "@/lib/useGridColumns";
import { useLayout } from "@/components/LayoutProvider";
import { WidgetShell } from "@/components/framework/WidgetShell";
import { WidgetSettingsPopover } from "@/components/framework/WidgetSettingsPopover";

const CHANNEL_REGIONS: ChannelRegion[] = ["left", "center", "right"];
const HERO_WIDGETS = new Set<WidgetId>(["identity", "now-playing", "currently-playing", "github"]);

function spanStyle(instance: WidgetInstance, gridCols: number) {
  const [cols, rows] = SPAN_MAP[`${instance.size}-${instance.orientation}`];
  return {
    gridColumn: `span ${Math.min(cols, gridCols)}`,
    gridRow: gridCols === 1 ? undefined : `span ${rows}`,
  };
}

function WidgetFrame({
  instance,
  editMode,
  className = "",
  style,
  dragControls,
}: {
  instance: WidgetInstance;
  editMode: boolean;
  className?: string;
  style?: CSSProperties;
  dragControls?: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    listeners: ReturnType<typeof useSortable>["listeners"];
  };
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
      <WidgetShell manifest={WIDGETS[instance.id]} config={instance} />
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

function ChannelWidget({ instance, editMode }: { instance: WidgetInstance; editMode: boolean }) {
  return (
    <WidgetFrame
      instance={instance}
      editMode={editMode}
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
  );
}

function ChannelDashboard() {
  const { layout, editMode } = useLayout();
  const visible = layout.widgets.filter((w) => !w.hidden);
  const columns: Record<ChannelRegion, WidgetInstance[]> = { left: [], center: [], right: [] };

  for (const instance of visible) {
    const manifest = WIDGETS[instance.id] as { channelRegion?: ChannelRegion };
    const region = manifest.channelRegion ?? "right";
    columns[region].push(instance);
  }

  return (
    <div className={`mx-auto max-w-[1800px] px-5 py-6${editMode ? " layout-editing" : ""}`}>
      <div className="frame frame-channels">
        <div className="frame-inner frame-inner-channels">
          <div className="channel-shell">
            {CHANNEL_REGIONS.map((region) => (
              <section key={region} className={`channel-column channel-column-${region}`}>
                <div className="channel-stack">
                  {columns[region].map((instance) => (
                    <ChannelWidget key={instance.id} instance={instance} editMode={editMode} />
                  ))}
                </div>
              </section>
            ))}

            <aside className="channel-rail" aria-label="companion rail">
              <div className="channel-rail-card">
                <div className="channel-rail-kicker">companion rail</div>
                <div className="channel-rail-title">cat dock</div>
                <p>
                  The companion lives on the right edge in this mode, with more breathing room for status text and
                  reactions.
                </p>
                <div className="channel-rail-meta">
                  <span>{visible.length} live widgets</span>
                  <span>{editMode ? "edit mode" : "locked layout"}</span>
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
