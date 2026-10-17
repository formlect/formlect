"use client"

import { cn } from "cn"
import { StarIcon } from "lucide-react"
import { useRef, useState } from "react"

const WORDS = ["Poor", "Fair", "Good", "Great", "Excellent"]

type RatingProps = {
  value?: number
  onValueChange?: (value: number) => void
  max?: number
  className?: string
}

// Star rating as an ARIA radiogroup (Formlect Components > Rating). Arrows move/select, hover previews,
// clicking the selected star clears it, picking a star plays a staggered "pop".
export function Rating({ value = 0, onValueChange, max = 5, className }: RatingProps) {
  const [hover, setHover] = useState(0)
  const [pop, setPop] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const shown = hover || value

  function pick(n: number) {
    const next = value === n && !hover ? 0 : n
    onValueChange?.(next)
    setHover(0)
    setPop(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPop(0), 260)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0
    if (!step) return
    e.preventDefault()
    pick(Math.min(max, Math.max(1, value + step)))
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="radiogroup"
        aria-label="Rating"
        onMouseLeave={() => setHover(0)}
        onKeyDown={onKeyDown}
        className="-m-1 flex gap-1 self-start p-1"
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const filled = n <= value && !hover
          const preview = hover > 0 && n <= hover
          const popping = pop > 0 && n <= pop
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              tabIndex={n === (value || 1) ? 0 : -1}
              onClick={() => pick(n)}
              onMouseEnter={() => setHover(n)}
              className={cn(
                "flex size-12 items-center justify-center rounded-xl outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/20",
                hover === n && "bg-tint"
              )}
            >
              <StarIcon
                style={{ transitionDelay: popping ? `${(n - 1) * 40}ms` : "0ms" }}
                className={cn(
                  "size-[34px] overflow-visible stroke-[1.6] transition-all duration-200 ease-[cubic-bezier(.2,1.6,.4,1)]",
                  filled ? "fill-primary stroke-primary" : preview ? "fill-primary-300 stroke-primary-400" : "fill-secondary stroke-input",
                  popping ? "scale-[1.22] -rotate-8" : hover === n ? "scale-110" : "scale-100"
                )}
              />
            </button>
          )
        })}
      </div>
      <div className="flex h-[22px] items-center gap-2">
        <span className={cn("text-sm font-extrabold transition-colors", preview(shown, hover) ? "text-primary-400" : "text-primary")}>
          {WORDS[shown - 1] ?? ""}
        </span>
        {value > 0 && (
          <span className="text-[12.5px] text-ink-3 tabular-nums">
            {value}/{max}
          </span>
        )}
      </div>
    </div>
  )
}

const preview = (shown: number, hover: number) => hover > 0 && shown === hover
