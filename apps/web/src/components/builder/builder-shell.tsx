"use client";

import {
  ChartColumnIcon, CloudAlertIcon, CloudCheckIcon, CloudUploadIcon, EyeIcon, GitBranchIcon, MonitorIcon, PaletteIcon, PencilIcon, PencilRulerIcon, Redo2Icon,
  Share2Icon, SmartphoneIcon, SendIcon, Undo2Icon, ChevronLeftIcon, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Canvas } from "./canvas";
import { PublishDialog } from "./publish-dialog";
import { QuickInsert } from "./quick-insert";
import { PageEditor } from "./page-editor";
import { BuildPanel } from "./build-panel";
import { DesignPanel } from "./design-panel";
import { FlowPanel } from "./flow-panel";
import { LogicMain } from "./logic-main";
import type { LoadedForm } from "./persist";
import type { Tab } from "./model";
import { useBuilder } from "./use-builder";

const TABS: { id: Tab | "share" | "results"; label: string; icon: LucideIcon; soon?: boolean }[] = [
  { id: "build", label: "Build", icon: PencilRulerIcon },
  { id: "logic", label: "Logic", icon: GitBranchIcon },
  { id: "design", label: "Design", icon: PaletteIcon },
  { id: "share", label: "Share", icon: Share2Icon, soon: true },
  { id: "results", label: "Results", icon: ChartColumnIcon, soon: true },
];

const iconBtn = "flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border-0 bg-transparent hover:bg-secondary disabled:cursor-default disabled:opacity-100 disabled:hover:bg-transparent";

export function BuilderShell({ form, tab }: { form: LoadedForm; tab: Tab }) {
  const b = useBuilder(form, tab);
  const { S, a } = b;

  // Keep ?tab= in the URL so a refresh reopens the same tab (replaceState: no navigation, no history entries).
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", S.tab);
    window.history.replaceState(null, "", url);
  }, [S.tab]);
  const pvOn = S.tab === "build" && S.mode === "preview";
  const save = { saving: { Icon: CloudUploadIcon, text: "Saving…" }, saved: { Icon: CloudCheckIcon, text: "Saved" }, error: { Icon: CloudAlertIcon, text: "Couldn’t save" } }[S.save];

  return (
    <div className="grid h-dvh grid-cols-[minmax(0,1fr)] grid-rows-[56px_minmax(0,1fr)] overflow-hidden bg-neutral-soft">
      <header className="z-5 flex min-w-0 items-center gap-3 border-b border-neutral-soft bg-card px-3">
        <div className="flex min-w-0 flex-1 basis-0 items-center gap-2.5">
          <Link href="/dashboard" aria-label="Back to dashboard" className="flex size-[34px] flex-none items-center justify-center rounded-[9px] text-ink-2 hover:bg-secondary hover:text-foreground"><ChevronLeftIcon className="size-[18px]" /></Link>
          <span className="h-5.5 w-px bg-neutral-soft" />
          <span className="min-w-27.5 truncate text-sm font-extrabold">{S.title || "Untitled form"}</span>
          {S.live ? (
            <span className="flex flex-none items-center gap-1.25 rounded-full border border-success-soft bg-success-soft px-2 py-0.5 text-[11.5px] font-extrabold text-success-foreground"><span className="size-1.5 animate-fl-pulse rounded-full bg-success" />Live</span>
          ) : (
            <span className="flex flex-none items-center gap-1.25 rounded-full border border-dashed border-border-strong bg-card px-2 py-0.5 text-[11.5px] font-extrabold text-ink-2"><span className="size-1.5 rounded-full bg-ink-3" />Draft</span>
          )}
          <span role="status" className={cn("flex flex-none items-center gap-1.25 text-[12.5px] whitespace-nowrap", S.save === "error" ? "text-destructive" : "text-ink-3")}><save.Icon className="size-4" />{save.text}</span>
        </div>

        <div role="tablist" className="flex min-w-0 flex-[0_1_auto] gap-0.5 overflow-hidden rounded-[10px] bg-secondary p-0.75">
          {TABS.map((t) => {
            const on = t.id === S.tab;
            return (
              <button key={t.id} type="button" role="tab" aria-selected={on} disabled={t.soon} title={t.soon ? `${t.label} is coming soon` : t.label} onClick={() => !t.soon && a.setTab(t.id as Tab)} className={cn("flex h-7.5 cursor-pointer items-center gap-1.5 rounded-lg border-0 px-3 text-[13px] font-bold whitespace-nowrap transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50", on ? "bg-card text-foreground shadow-[0_1px_2px_rgb(27_23_36/0.1)]" : "bg-transparent text-muted-foreground hover:text-foreground")}>
                <t.icon className="size-4" />
                <span className="hidden min-[1180px]:inline">{t.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-none items-center justify-end gap-1.5">
          <button type="button" title="Undo (⌘Z)" aria-label="Undo" disabled={!S.past.length} onClick={a.undo} className={cn(iconBtn, S.past.length ? "text-sidebar-foreground" : "text-control")}><Undo2Icon className="size-4" /></button>
          <button type="button" title="Redo (⇧⌘Z)" aria-label="Redo" disabled={!S.future.length} onClick={a.redo} className={cn(iconBtn, S.future.length ? "text-sidebar-foreground" : "text-control")}><Redo2Icon className="size-4" /></button>
          <div className="mx-1 flex rounded-[9px] bg-secondary p-0.75">
            {([["desktop", "Desktop", MonitorIcon], ["mobile", "Mobile", SmartphoneIcon]] as const).map(([id, label, Icon]) => (
              <button key={id} type="button" title={label} aria-label={label} aria-pressed={S.device === id} onClick={() => b.set({ device: id })} className={cn("flex h-7 w-7.5 cursor-pointer items-center justify-center rounded-[7px] border-0 transition-all duration-150", S.device === id ? "bg-card text-foreground shadow-[0_1px_2px_rgb(27_23_36/0.1)]" : "bg-transparent text-muted-foreground")}><Icon className="size-4" /></button>
            ))}
          </div>
          <button type="button" title="⌘P" onClick={a.togglePreview} className={cn("flex h-8.5 cursor-pointer items-center gap-1.5 rounded-[9px] border px-3 text-[13px] font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.97]", pvOn ? "border-foreground bg-foreground text-background" : "border-input bg-card text-foreground")}>
            {pvOn ? <PencilIcon className="size-4" /> : <EyeIcon className="size-4" />}
            {pvOn ? "Edit" : "Preview"}
          </button>
          <Button className="h-8.5 rounded-[9px] px-3.5 text-[13px]" onClick={() => b.set({ publish: true })}><SendIcon />{S.live ? "Share" : "Publish"}</Button>
        </div>
      </header>

      {S.tab === "design" && S.landing ? (
        <PageEditor b={b} />
      ) : (
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_340px]">
          {S.tab === "logic" ? <LogicMain b={b} /> : <Canvas b={b} />}
          {S.tab === "build" && <BuildPanel b={b} />}
          {S.tab === "design" && <DesignPanel b={b} />}
          {S.tab === "logic" && <FlowPanel b={b} />}
        </div>
      )}

      <QuickInsert b={b} />
      <PublishDialog b={b} />
    </div>
  );
}
