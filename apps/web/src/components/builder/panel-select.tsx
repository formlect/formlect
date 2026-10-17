"use client";

import { ChevronDownIcon } from "lucide-react";
import { cn } from "cn";

export function Select({ value, onChange, options, className, label }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[]; className?: string; label: string }) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-9 w-full cursor-pointer appearance-none truncate rounded-[9px] border border-input bg-card py-0 pr-7 pl-2.5 text-[13.5px] font-bold outline-none focus:border-primary focus:ring-3 focus:ring-ring/20">
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-[9px] size-3.5 -translate-y-1/2 text-ink-3" />
    </div>
  );
}
