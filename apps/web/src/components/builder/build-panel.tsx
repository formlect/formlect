"use client";

import { PlusIcon, SlidersHorizontalIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import type { Builder } from "./use-builder";
import { Aside } from "./aside";
import { AddPanel } from "./add-panel";
import { SettingsPanel } from "./settings-panel";

export function BuildPanel({ b }: { b: Builder }) {
  const { S } = b;
  const tab = (id: "add" | "settings", label: string, Icon: LucideIcon) => (
    <button type="button" onClick={() => b.set({ panel: id })} className={cn("-mb-px flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 border-0 border-b-2 bg-transparent text-[13.5px] font-bold", S.panel === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground")}>
      <Icon className="size-4" />
      {label}
    </button>
  );
  return (
    <Aside>
      <div className="flex border-b border-neutral-soft px-2">{tab("add", "Add field", PlusIcon)}{tab("settings", "Settings", SlidersHorizontalIcon)}</div>
      <div className="min-h-0 flex-1 overflow-auto">{S.panel === "add" ? <AddPanel b={b} /> : <SettingsPanel b={b} />}</div>
    </Aside>
  );
}
