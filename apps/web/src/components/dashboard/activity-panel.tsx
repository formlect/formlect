"use client";

import { FilePlusIcon, GlobeIcon, PencilIcon } from "lucide-react";
import { useMemo } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { type FormSummary, timeAgo } from "@/lib/forms";
import { useFormsStore } from "@/stores/forms-store";

const KINDS = {
  published: { icon: GlobeIcon, text: "published", tile: "bg-success-soft text-success-foreground" },
  edited: { icon: PencilIcon, text: "edited", tile: "bg-secondary text-ink-2" },
  created: { icon: FilePlusIcon, text: "created", tile: "bg-accent text-primary" },
} as const;

// The API has no activity log, so events are derived from each form's own timestamps.
function toEvents(forms: FormSummary[]) {
  const events: { key: string; kind: keyof typeof KINDS; title: string; at: string }[] = [];
  for (const f of forms) {
    events.push({ key: `${f.id}-c`, kind: "created", title: f.title, at: f.createdAt });
    if (f.publishedAt) events.push({ key: `${f.id}-p`, kind: "published", title: f.title, at: f.publishedAt });
    // Skip "edited" when the update is just the create or publish write itself.
    const ms = (s?: string | null) => (s ? new Date(s).getTime() : 0);
    if (ms(f.updatedAt) - Math.max(ms(f.createdAt), ms(f.publishedAt)) > 60_000) events.push({ key: `${f.id}-e`, kind: "edited", title: f.title, at: f.updatedAt });
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
}

export function ActivityPanel() {
  const forms = useFormsStore((s) => s.forms);
  const status = useFormsStore((s) => s.status);
  const events = useMemo(() => toEvents(forms), [forms]);

  return (
    <aside className="flex max-w-95 flex-1 basis-75 flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold tracking-[-0.015em]">Activity</h2>
      <div className="flex flex-col rounded-[14px] border border-border bg-card p-1.5">
        {status === "loading" && [0, 1, 2].map((i) => <Skeleton key={i} className="m-2.5 h-9" />)}
        {status !== "loading" && events.length === 0 && <p className="p-4 text-[13.5px] text-muted-foreground">Nothing yet. Create a form and it will show up here.</p>}
        {events.map(({ key, kind, title, at }) => {
          const { icon: Icon, text, tile } = KINDS[kind];
          return (
            <div key={key} className="flex gap-3 rounded-[10px] p-2.5">
              <span className={`flex size-8 flex-none items-center justify-center rounded-[9px] ${tile}`}>
                <Icon className="size-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13.5px] leading-snug text-ink-2">
                  <b className="font-bold text-foreground">You</b> {text}
                </span>
                <span className="truncate text-[12.5px] text-ink-3">
                  {title} · {timeAgo(at)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4">
        <span className="text-[13.5px] font-extrabold">Keyboard</span>
        {[
          ["Search everything", "⌘K"],
          ["New form", "N"],
          ["Filter forms", "/"],
        ].map(([label, key]) => (
          <div key={label} className="flex items-center justify-between text-[13px] text-ink-2">
            <span>{label}</span>
            <Kbd>{key}</Kbd>
          </div>
        ))}
      </div>
    </aside>
  );
}
