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
import { GripHorizontal, Settings2 } from "lucide-react";
import { WIDGETS, type WidgetId } from "@/config/widgets";
import { widgetRegistry, type WidgetRegistryEntry, type WidgetSizePreset } from "@/widgets/registry";
import { useGridColumns } from "@/lib/useGridColumns";
import { useLayout } from "@/components/LayoutProvider";
import { WidgetShell } from "@/components/framework/WidgetShell";
import { WidgetSettingsPopover } from "@/components/framework/WidgetSettingsPopover";
import type { WidgetInstance } from "@/lib/layout";
import { DashboardSidebar } from "@/components/Sidebar";
import { RightCompanionPanel } from "@/components/RightCompanionPanel";

const SIZE_SPANS: Record<WidgetSizePreset, { cols: number; rows: number }> = {
  small: { cols: 1, rows: 1 },
  medium: { cols: 2, rows: 1 },
  large: { cols: 2, rows: 2 },
  wide: { cols: 4, rows: 1 },
};

const REGISTRY = new Map(widgetRegistry.map((entry) => [entry.id, entry] as const));

function spanStyle(entry: WidgetRegistryEntry, gridCols: number): CSSProperties {
  const span = SIZE_SPANS[entry.size];
  return {
    gridColumn: `span ${Math.min(span.cols, gridCols)}`,
    gridRow: `span ${span.rows}`,
  };
}

function DashboardCard({
  id,
  instance,
  editMode,
  gridCols,
}: {
  id: WidgetId;
  instance: WidgetInstance;
  editMode: boolean;
  gridCols: number;
}) {
  const registry = REGISTRY.get(id);
  const manifest = WIDGETS[id];
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });

  if (!registry || !manifest) return null;

  return (
    <div
      ref={setNodeRef}
      className={`widget-slot${editMode ? " editing" : ""}${isDragging ? " dragging" : ""}`}
      style={spanStyle(registry, gridCols)}
    >
      {editMode && (
        <>
          <button
            type="button"
            className="drag-handle"
            aria-label={`move ${id} widget`}
            {...attributes}
            {...listeners}
          >
            <GripHorizontal size={12} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className="gear-btn"
            aria-label={`configure ${id} widget`}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings2 size={12} strokeWidth={1.8} />
          </button>
          {settingsOpen && (
            <WidgetSettingsPopover
              manifest={manifest}
              instance={instance}
              onClose={() => setSettingsOpen(false)}
            />
          )}
        </>
      )}
      <WidgetShell manifest={manifest} config={instance} />
    </div>
  );
}

function GridDashboard() {
  const { layout, reorderWidget, editMode } = useLayout();
  const gridCols = useGridColumns();
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const lastOverPair = useRef<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visible = useMemo(() => layout.widgets.filter((widget) => !widget.hidden && REGISTRY.has(widget.id)), [layout.widgets]);
  const activeInstance = activeId ? visible.find((widget) => widget.id === activeId) : null;

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
    <div className="dashboard-frame">
      <DashboardSidebar />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        measuring={{ droppable: { strategy: MeasuringStrategy.BeforeDragging } }}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={() => setActiveId(null)}
        onDragCancel={() => setActiveId(null)}
      >
        <main className={`dashboard-shell${editMode ? " editing" : ""}`}>
          <SortableContext items={visible.map((widget) => widget.id)}>
            <div className="widget-grid">
              {visible.map((widget) => (
                <DashboardCard
                  key={widget.id}
                  id={widget.id}
                  instance={widget}
                  editMode={editMode}
                  gridCols={gridCols}
                />
              ))}
            </div>
          </SortableContext>
        </main>

        <DragOverlay dropAnimation={null}>
          {activeInstance && REGISTRY.has(activeInstance.id) && (
            <div className="widget-slot drag-preview">
              <WidgetShell manifest={WIDGETS[activeInstance.id]} config={activeInstance} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <RightCompanionPanel />
    </div>
  );
}

export { GridDashboard as Dashboard };
