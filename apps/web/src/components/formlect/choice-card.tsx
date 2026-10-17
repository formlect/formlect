"use client"

import { Radio } from "@base-ui/react/radio"
import { RadioGroup } from "@base-ui/react/radio-group"
import { cn } from "cn"
import { CheckIcon } from "lucide-react"

export type ChoiceOption = { value: string; label: string }

type ChoiceCardProps = {
  options: ChoiceOption[]
  value?: string
  onValueChange?: (value: string) => void
  /** Show A, B, C... key hints (Formlect Components > ChoiceCard). */
  keys?: boolean
  className?: string
}

// RadioGroup whose items are full-width cards. Selected state comes from base-ui's data-checked.
export function ChoiceCard({ options, value, onValueChange, keys = true, className }: ChoiceCardProps) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onValueChange?.(v as string)}
      className={cn("grid w-full gap-2", className)}
    >
      {options.map((o, i) => (
        <Radio.Root
          key={o.value}
          value={o.value}
          className="group/choice flex h-[46px] items-center gap-2.5 rounded-[11px] border-[1.5px] border-border bg-card px-3 text-left text-[14.5px] font-semibold transition-all duration-150 outline-none hover:border-primary-300 focus-visible:ring-3 focus-visible:ring-ring/20 data-checked:border-primary data-checked:bg-tint"
        >
          {keys && (
            <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-md border border-border-strong bg-card text-[11px] transition-all duration-150 group-data-checked/choice:border-primary group-data-checked/choice:bg-primary group-data-checked/choice:text-primary-foreground">
              {String.fromCharCode(65 + i)}
            </span>
          )}
          {o.label}
          <CheckIcon className="ml-auto size-4 scale-50 text-primary opacity-0 transition-all duration-200 ease-[cubic-bezier(.2,1.4,.4,1)] group-data-checked/choice:scale-100 group-data-checked/choice:opacity-100" />
        </Radio.Root>
      ))}
    </RadioGroup>
  )
}
