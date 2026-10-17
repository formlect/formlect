"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useFormsStore } from "@/stores/forms-store";

// Derived from the forms list; the API has no time-series or completion data yet.
export function Stats() {
  const forms = useFormsStore((s) => s.forms);
  const status = useFormsStore((s) => s.status);
  const live = forms.filter((f) => f.isPublished).length;
  const items = [
    { label: "Total responses", value: forms.reduce((n, f) => n + f.submissionCount, 0), hint: "across all forms" },
    { label: "Live forms", value: live, hint: "collecting right now" },
    { label: "Drafts", value: forms.length - live, hint: "not published yet" },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
      {items.map(({ label, value, hint }) => (
        <div key={label} className="flex flex-col gap-2.5 rounded-[14px] border border-border bg-card px-[18px] py-4">
          <span className="text-[12.5px] font-bold text-muted-foreground">{label}</span>
          {status === "loading" ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-[28px] font-semibold tracking-[-0.02em] tabular-nums">{value.toLocaleString()}</span>
              <span className="text-[12.5px] text-muted-foreground">{hint}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
