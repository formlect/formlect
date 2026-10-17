"use client";

import { PlusIcon } from "lucide-react";
import { cn } from "cn";
import { groupName, T } from "./model";
import type { Builder } from "./use-builder";

// "/" quick insert: a keyboard-first field picker (design: Insert a field…).
export function QuickInsert({ b }: { b: Builder }) {
  const { S, a } = b;
  if (!S.qi) return null;
  const items = a.qiList();
  const close = () => b.set({ qi: false });
  return (
    <>
      <div onClick={close} className="fixed inset-0 z-40 animate-fl-fade bg-[rgb(27_23_36/0.18)]" />
      <div role="dialog" aria-label="Insert a field" className="fixed top-[110px] left-[calc((100vw-340px)/2)] z-[41] w-[min(420px,90vw)] -translate-x-1/2 animate-fl-rise overflow-hidden rounded-[14px] bg-popover shadow-modal">
        <div className="flex items-center gap-2.5 border-b border-neutral-soft px-3.5">
          <PlusIcon className="size-4 text-primary" />
          <input
            autoFocus
            value={S.qq}
            aria-label="Insert a field"
            placeholder="Insert a field…"
            onChange={(e) => b.set({ qq: e.target.value, qx: 0 })}
            onKeyDown={(e) => {
              const n = Math.max(1, items.length);
              if (e.key === "Escape") { e.preventDefault(); close(); }
              if (e.key === "ArrowDown") { e.preventDefault(); b.set({ qx: (S.qx + 1) % n }); }
              if (e.key === "ArrowUp") { e.preventDefault(); b.set({ qx: (S.qx - 1 + n) % n }); }
              if (e.key === "Enter" && items[S.qx]) { e.preventDefault(); a.add(items[S.qx]); }
            }}
            className="h-12 flex-1 border-0 bg-transparent text-[15px] outline-none"
          />
          <span className="rounded-[5px] border border-b-2 border-input px-1.5 font-mono text-[11px] text-muted-foreground">Esc</span>
        </div>
        <div className="max-h-[340px] overflow-auto p-1.5">
          {items.map((k, j) => {
            const Icon = T[k].i;
            const on = j === S.qx;
            return (
              <div key={k} role="button" onClick={() => a.add(k)} onMouseEnter={() => b.set({ qx: j })} className={cn("flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2", on && "bg-tint")}>
                <span className={cn("flex size-7 items-center justify-center rounded-lg", on ? "bg-primary text-primary-foreground" : "bg-secondary text-ink-2")}><Icon className="size-4" /></span>
                <span className="flex-1 text-sm font-bold">{T[k].n}</span>
                <span className="text-xs text-ink-3">{groupName(T[k].g)}</span>
              </div>
            );
          })}
          {!items.length && <div className="p-5 text-center text-[13.5px] text-muted-foreground">No field matches</div>}
        </div>
      </div>
    </>
  );
}
