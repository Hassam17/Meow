"use client";

import { useRef, useState } from "react";
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
import { SPAN_MAP, WIDGETS, type WidgetId } from "@/config/widgets";
import type { WidgetInstance } from "@/lib/layout";
import { useGridColumns } from "@/lib/useGridColumns";
import { useLayout } from "@/components/LayoutProvider";
import { WidgetShell } from "@/components/framework/WidgetShell";
import { WidgetSettingsPopover } from "@/components/framework/WidgetSettingsPopover";

function spanStyle(instance: WidgetInstance, gridCols: number) {
  const [cols, rows] = SPAN_MAP[`${instance.size}-${instance.orientation}`];
  return {
    gridColumn: `span ${Math.min(cols, gridCols)}`,
    gridRow: gridCols === 1 ? undefined : `span ${rows}`,
  };
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
  // no sortable transform strategy — with variable spans + dense flow the
  // grid itself reflows on live reorder; the DragOverlay carries the visual
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: instance.id,
    disabled: !editMode,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!editMode && settingsOpen) setSettingsOpen(false);

  return (
    <div
      ref={setNodeRef}
      className={`widget-slot${editMode ? " editing" : ""}${isDragging ? " dragging" : ""}`}
      style={spanStyle(instance, gridCols)}
    >
      {editMode && (
        <>
          <button
            type="button"
            className="drag-handle"
            aria-label={`move ${instance.id} widget`}
            {...attributes}
            {...listeners}
          >
            <GripHorizontal size={12} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            className="gear-btn"
            aria-label={`configure ${instance.id} widget`}
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <Settings2 size={12} strokeWidth={1.75} />
          </button>
          {settingsOpen && (
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

export function Dashboard() {
  const { layout, reorderWidget, editMode } = useLayout();
  const gridCols = useGridColumns();
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  // last (active, over) pair we reordered for — dedupes onDragOver storms so a
  // dense-reflow-triggered re-measure can't feed back into another reorder
  const lastOverPair = useRef<string | null>(null);

  // small activation distance so plain clicks on the handle don't start a drag
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const visible = layout.widgets.filter((w) => !w.hidden);
  const activeInstance = activeId ? visible.find((w) => w.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as WidgetId);
    lastOverPair.current = null;
  }

  // reorder live while dragging so the grid reflows under the pointer
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
