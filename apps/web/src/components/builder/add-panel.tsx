"use client";

import { LightbulbIcon, SearchIcon } from "lucide-react";
import { cn } from "cn";
import { GROUPS, T, TYPE_KEYS } from "./model";
import type { Builder } from "./use-builder";
import { field, cap } from "./panel-styles";

export function AddPanel({ b }: { b: Builder }) {
  const { S, a } = b;
  const q = S.pq.trim().toLowerCase();
  const groups = GROUPS.map(([g, name]) => ({ name, items: TYPE_KEYS.filter((k) => T[k].g === g && (!q || T[k].n.toLowerCase().includes(q) || name.toLowerCase().includes(q))) })).filter((g) => g.items.length);
  return (
    <div className="flex flex-col gap-4 p-3.5">
      <div className="relative">
        <SearchIcon className="absolute top-1/2 left-2.75 size-4 -translate-y-1/2 text-ink-3" />
        <input value={S.pq} onChange={(e) => b.set({ pq: e.target.value })} placeholder="Search fields" aria-label="Search fields" className={cn(field, "w-full pr-2.5 pl-8.5")} />
      </div>
      {groups.map((g) => (
        <div key={g.name} className="flex flex-col gap-2">
          <span className={cap}>{g.name.toUpperCase()}</span>
          <div className="grid grid-cols-2 gap-1.5">
            {g.items.map((k) => {
              const Icon = T[k].i;
              return (
                <div key={k} draggable onDragStart={(e) => a.startTypeDrag(k, e)} onDragEnd={a.endDrag} onClick={() => a.add(k)} title="Click to add, or drag into the form" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); a.add(k); } }} className="flex h-10 cursor-grab items-center gap-2.25 rounded-[10px] border border-neutral-soft bg-card px-2.5 text-[13px] font-bold transition-all duration-150 outline-none select-none hover:-translate-y-px hover:border-primary-300 hover:bg-tint-soft hover:shadow-[0_4px_10px_-6px_rgb(75_43_209/0.35)] focus-visible:ring-3 focus-visible:ring-ring/20 active:scale-[0.97]">
                  <span className="flex size-6 flex-none items-center justify-center rounded-[7px] bg-secondary text-sidebar-foreground"><Icon className="size-3.25" /></span>
                  <span className="truncate">{T[k].n}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      {!groups.length && <span className="py-5 text-center text-[13.5px] text-muted-foreground">No field matches “{S.pq}”</span>}
      <div className="flex gap-2.5 rounded-[11px] bg-background p-3 text-[12.5px] leading-normal text-ink-2">
        <LightbulbIcon className="mt-0.5 size-4 flex-none text-primary" />
        <span>New fields go below the selected question. Drag a tile to drop it anywhere.</span>
      </div>
    </div>
  );
}
