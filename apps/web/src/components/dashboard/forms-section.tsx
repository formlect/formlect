"use client";

import { ArrowDownUpIcon, CircleAlertIcon, LayoutGridIcon, ListIcon, PlusIcon, SearchIcon, SearchXIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FormSummary } from "@/lib/forms";
import { isTyping } from "@/lib/is-typing";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFormsStore } from "@/stores/forms-store";
import { FormCard } from "./form-card";
import { FormsTable } from "./forms-table";

type Tab = "all" | "live" | "draft";
type View = "grid" | "list";

const SORTS: [string, (a: FormSummary, b: FormSummary) => number][] = [
  ["Last activity", (a, b) => b.updatedAt.localeCompare(a.updatedAt)],
  ["Most responses", (a, b) => b.submissionCount - a.submissionCount],
  ["Name", (a, b) => a.title.localeCompare(b.title)],
];

export function FormsSection() {
  const forms = useFormsStore((s) => s.forms);
  const status = useFormsStore((s) => s.status);
  const query = useDashboardStore((s) => s.query);
  const setQuery = useDashboardStore((s) => s.setQuery);
  const setNewOpen = useDashboardStore((s) => s.setNewOpen);
  const refresh = useFormsStore((s) => s.load);
  const [tab, setTab] = useState<Tab>("all");
  const [sort, setSort] = useState(0);
  const [view, setView] = useState<View>("grid");
  const filterRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the filter, like the shortcut card says.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !isTyping(e.target)) {
        e.preventDefault();
        filterRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = { all: forms.length, live: forms.filter((f) => f.isPublished).length, draft: forms.filter((f) => !f.isPublished).length };
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms
      .filter((f) => (tab === "all" || f.isPublished === (tab === "live")) && (!q || f.title.toLowerCase().includes(q)))
      .sort(SORTS[sort][1]);
  }, [forms, tab, query, sort]);

  return (
    <section id="forms" className="flex min-w-0 flex-1 basis-[580px] scroll-mt-6 flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-[-0.015em]">Your forms</h2>
        <div className="flex-1" />
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
          <Input ref={filterRef} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter forms" aria-label="Filter forms" className="h-[34px] w-50 pr-8 pl-8 text-[13.5px]" />
          <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border-0 bg-transparent">/</Kbd>
        </div>
        <Button variant="outline" size="sm" className="h-[34px]" onClick={() => setSort((s) => (s + 1) % SORTS.length)}>
          <ArrowDownUpIcon />
          {SORTS[sort][0]}
        </Button>
        <ToggleGroup value={[view]} onValueChange={(v) => v[0] && setView(v[0] as View)}>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <LayoutGridIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <ListIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          {(["all", "live", "draft"] as const).map((t) => (
            <TabsTrigger key={t} value={t} className="flex-none capitalize">
              {t === "draft" ? "Drafts" : t}
              <span className="rounded-full bg-neutral-soft px-[7px] py-px text-[11.5px] font-extrabold text-ink-3 tabular-nums">{counts[t]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {status === "loading" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[236px] rounded-[14px]" />
          ))}
        </div>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertTitle>We couldn’t load your forms</AlertTitle>
          <AlertDescription>
            Check your connection and try again.
            <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={refresh}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {status === "ready" && view === "grid" && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="flex min-h-[236px] flex-col items-center justify-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-primary-300 bg-tint-soft text-primary transition-colors hover:border-primary hover:bg-tint"
          >
            <span className="flex size-10 items-center justify-center rounded-xl border border-accent-hover bg-card">
              <PlusIcon className="size-5" />
            </span>
            <span className="text-sm font-extrabold">New form</span>
            <span className="text-[12.5px] text-muted-foreground">Name it and start building</span>
          </button>
          {visible.map((f) => (
            <FormCard key={f.id} form={f} />
          ))}
        </div>
      )}

      {status === "ready" && view === "list" && visible.length > 0 && <FormsTable forms={visible} />}

      {status === "ready" && visible.length === 0 && (
        <div className="flex flex-col items-center gap-2.5 rounded-[14px] border-[1.5px] border-dashed border-input p-12 text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-neutral-soft text-muted-foreground">
            <SearchXIcon className="size-5" />
          </span>
          <span className="text-[15px] font-extrabold">{forms.length ? "No forms match" : "No forms yet"}</span>
          <span className="text-[13.5px] text-muted-foreground">{forms.length ? "Try another filter, or start a new form." : "Create your first form to start collecting responses."}</span>
          <Button
            variant="outline"
            className="mt-1.5"
            onClick={() => {
              if (forms.length) {
                setQuery("");
                setTab("all");
              } else setNewOpen(true);
            }}
          >
            {forms.length ? "Clear filters" : "New form"}
          </Button>
        </div>
      )}
    </section>
  );
}
