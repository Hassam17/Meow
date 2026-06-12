"use client";

import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal } from "lucide-react";
import { COLUMNS, WIDGETS, type ColumnDef, type WidgetDef, type WidgetId } from "@/config/widgets";
import { useLayout } from "@/components/LayoutProvider";

function SortableWidget({ id, editMode }: { id: WidgetId; editMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !editMode,
  });
  const Widget = WIDGETS[id].component;

  return (
    <div
      ref={setNodeRef}
      className={`widget-slot${editMode ? " editing" : ""}${isDragging ? " dragging" : ""}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {editMode && (
        <button type="button" className="drag-handle" aria-label={`move ${id} widget`} {...attributes} {...listeners}>
          <GripHorizontal size={12} strokeWidth={1.75} />
        </button>
      )}
      <Widget />
    </div>
  );
}

function Column({ col, widgets, editMode }: { col: ColumnDef; widgets: WidgetId[]; editMode: boolean }) {
  // the column itself is droppable so widgets can be dragged into it even
  // when it's empty (no sortable items to target)
  const { setNodeRef } = useDroppable({ id: col.id, disabled: !editMode });

  return (
    <div ref={setNodeRef} className={`frame-col flex w-full flex-col gap-2.5 ${col.className}`}>
      <SortableContext items={widgets} strategy={verticalListSortingStrategy}>
        {widgets.map((id) => (
          <SortableWidget key={id} id={id} editMode={editMode} />
        ))}
      </SortableContext>
    </div>
  );
}

export function Dashboard() {
  const { layout, setLayout, editMode } = useLayout();

  // small activation distance so plain clicks on the handle don't start a drag
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function findColumn(id: string): string | null {
    if (id in layout) return id;
    for (const [colId, ids] of Object.entries(layout)) {
      if (ids.includes(id as WidgetId)) return colId;
    }
    return null;
  }

  function canDrop(widgetId: WidgetId, colId: string): boolean {
    const { minColWidth: min }: WidgetDef = WIDGETS[widgetId];
    if (!min) return true;
    const width = COLUMNS.find((c) => c.id === colId)?.width;
    return width === null || width === undefined || width >= min;
  }

  // cross-column moves happen live while dragging so the columns reflow
  // under the pointer; same-column reordering is settled in onDragEnd
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as WidgetId;
    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from === to) return;
    if (!canDrop(activeId, to)) return;

    setLayout((prev) => {
      const fromItems = prev[from].filter((id) => id !== activeId);
      const toItems = prev[to].filter((id) => id !== activeId);
      const overIndex = toItems.indexOf(over.id as WidgetId);
      toItems.splice(overIndex >= 0 ? overIndex : toItems.length, 0, activeId);
      return { ...prev, [from]: fromItems, [to]: toItems };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const from = findColumn(String(active.id));
    const to = findColumn(String(over.id));
    if (!from || !to || from !== to) return;

    const oldIndex = layout[from].indexOf(active.id as WidgetId);
    const newIndex = layout[from].indexOf(over.id as WidgetId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    setLayout((prev) => ({ ...prev, [from]: arrayMove(prev[from], oldIndex, newIndex) }));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={`mx-auto max-w-[1800px] px-5 py-6${editMode ? " layout-editing" : ""}`}>
        <div className="frame">
          <div className="frame-inner flex flex-col-reverse gap-5 lg:flex-row">
            {COLUMNS.map((col) => (
              <Column key={col.id} col={col} widgets={layout[col.id] ?? []} editMode={editMode} />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  );
}
