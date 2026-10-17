"use client"

import { cn } from "cn"

type ScaleButtonsProps = {
  value?: number
  onValueChange?: (value: number) => void
  min?: number
  max?: number
  lowLabel?: string
  highLabel?: string
  className?: string
}

// Joined numeric scale (NPS 0-10 by default).
export function ScaleButtons({
  value,
  onValueChange,
  min = 0,
  max = 10,
  lowLabel = "Not likely",
  highLabel = "Very likely",
  className,
}: ScaleButtonsProps) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="radiogroup"
        className="grid overflow-hidden rounded-[10px] border border-input"
        style={{ gridTemplateColumns: `repeat(${nums.length}, 1fr)` }}
      >
        {nums.map((n, i) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onValueChange?.(n)}
            className={cn(
              "flex h-10 items-center justify-center text-[13.5px] font-extrabold outline-none transition-colors duration-150 focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/20",
              i > 0 && "border-l border-input",
              value === n ? "bg-primary text-primary-foreground" : "bg-card hover:bg-tint"
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-ink-3">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  )
}
