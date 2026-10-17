"use client";

import { cn } from "cn";
import { mono } from "./canvas-theme";

export function Shortcuts() {
  const items: [string, string][] = [["/", "insert"], ["↑↓", "select"], ["⌥↑↓", "move"], ["⌘D", "duplicate"], ["⌫", "delete"], ["⌘Z", "undo"], ["⌘P", "preview"]];
  return (
    <div className="mx-auto mt-[18px] flex max-w-[680px] flex-wrap justify-center gap-[18px] text-xs text-ink-3">
      {items.map(([k, l]) => (
        <span key={k} className="whitespace-nowrap">
          <b className={cn(mono, "font-medium")}>{k}</b> {l}
        </span>
      ))}
    </div>
  );
}
