"use client"

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useId } from "react"

type SortableFieldListProps<T extends { id: string }> = {
  items: T[]
  onReorder: (items: T[]) => void
  children: React.ReactNode
}

// Drag-and-drop container (pointer + keyboard). Render one <FieldBlock id={item.id} /> per item as children.
export function SortableFieldList<T extends { id: string }>({ items, onReorder, children }: SortableFieldListProps<T>) {
  const dndId = useId() // stable id: avoids dnd-kit SSR/CSR aria id mismatch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3.5 pl-7">{children}</div>
      </SortableContext>
    </DndContext>
  )
}
