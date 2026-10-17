"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "cn"
import { AsteriskIcon, CopyIcon, GitBranchIcon, GripVerticalIcon, Trash2Icon } from "lucide-react"
import { FIELD_TYPES, type FieldType } from "./field-types"

export type FieldBlockProps = {
  id: string
  type: FieldType
  /** Machine name shown in mono next to the type chip. */
  name?: string
  label: string
  required?: boolean
  selected?: boolean
  onSelect?: () => void
  onDuplicate?: () => void
  onToggleRequired?: () => void
  onLogic?: () => void
  onDelete?: () => void
  /** Preview of the control (e.g. a disabled Input). */
  children?: React.ReactNode
}

const toolBtn =
  "flex h-[26px] w-7 items-center justify-center rounded-md text-[13px] text-background outline-none transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-highlight [&_svg]:size-3.5"

// One field in the builder. Sortable: put inside <SortableFieldList>.
export function FieldBlock({
  id, type, name, label, required, selected, onSelect, onDuplicate, onToggleRequired, onLogic, onDelete, children,
}: FieldBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const meta = FIELD_TYPES[type]
  const Icon = meta.icon

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={cn(
        "group/field relative flex flex-col gap-2 rounded-xl border bg-card px-4 py-3.5 transition-shadow duration-150",
        selected ? "border-2 border-primary shadow-[0_0_0_4px_var(--accent)]" : "border-border hover:border-input",
        isDragging && "z-10 opacity-80 shadow-pop"
      )}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
        className="absolute top-4 -left-[26px] cursor-grab touch-none rounded-md p-0.5 text-ink-3 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/20 active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>

      {selected && (
        <div className="absolute -top-[18px] right-2.5 flex gap-0.5 rounded-[9px] bg-foreground p-[3px]" onClick={(e) => e.stopPropagation()}>
          <button type="button" aria-label="Duplicate" onClick={onDuplicate} className={toolBtn}><CopyIcon /></button>
          <button type="button" aria-label="Toggle required" aria-pressed={required} onClick={onToggleRequired} className={toolBtn}><AsteriskIcon /></button>
          <button type="button" aria-label="Logic" onClick={onLogic} className={toolBtn}><GitBranchIcon /></button>
          <button type="button" aria-label="Delete" onClick={onDelete} className={cn(toolBtn, "text-highlight")}><Trash2Icon /></button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="flex items-center gap-[5px] rounded-md bg-secondary px-[7px] py-0.5 text-[11.5px] font-extrabold text-ink-2 [&_svg]:size-3">
          <Icon />
          {meta.label}
        </span>
        {name && <span className="font-mono text-[11px] text-ink-3">{name}</span>}
      </div>
      <span className="text-[15px] font-bold">
        {label}
        {required && <span className="text-primary"> *</span>}
      </span>
      {children}
    </div>
  )
}
