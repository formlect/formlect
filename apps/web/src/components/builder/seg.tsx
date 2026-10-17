"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "cn";

export function Seg<V extends string | number>({ value, onChange, items, className }: { value: V; onChange: (v: V) => void; items: { v: V; label: string; icon?: LucideIcon }[]; className?: string }) {
  return (
    <div role="radiogroup" className={cn("flex rounded-[9px] bg-secondary p-[3px]", className)}>
      {items.map(({ v, label, icon: Icon }) => (
        <button key={String(v)} type="button" role="radio" aria-checked={v === value} onClick={() => onChange(v)} className={cn("flex h-7 flex-1 cursor-pointer items-center justify-center gap-[5px] rounded-[7px] text-[12.5px] font-bold transition-all duration-150", v === value ? "bg-card text-foreground shadow-[0_1px_2px_rgb(27_23_36/0.1)]" : "text-muted-foreground hover:text-foreground")}>
          {Icon && <Icon className="size-4" />}
          {label}
        </button>
      ))}
    </div>
  );
}
