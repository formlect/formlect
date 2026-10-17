import { InboxIcon } from "lucide-react";
import Link from "next/link";
import { type FormSummary, timeAgo } from "@/lib/forms";
import { cn } from "cn";
import { FormMenu } from "./form-menu";
import { tone } from "./form-tone";
import { StatusBadge } from "./status-badge";

export function FormCard({ form }: { form: FormSummary }) {
  return (
    <div className="group/form relative flex animate-fl-up flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_2px_rgb(27_23_36/0.03)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[0_12px_28px_-14px_rgb(27_23_36/0.25)]">
      <div className={cn("relative h-[118px] px-[22px] pt-4", tone(form.id))}>
        <div className="flex h-full flex-col gap-[7px] rounded-t-[10px] bg-card p-3 shadow-[0_-1px_0_rgb(27_23_36/0.04),0_4px_12px_-6px_rgb(27_23_36/0.15)]">
          <div className="h-1.5 w-[55%] rounded-[3px] bg-foreground/75" />
          <div className="h-1 w-4/5 rounded-sm bg-row-line" />
          <div className="h-3.5 rounded-sm border border-border" />
          <div className="h-3.5 rounded-sm border border-border" />
        </div>
        <FormMenu form={form} className="absolute top-2.5 right-2.5 z-10 opacity-0 transition-opacity group-focus-within/form:opacity-100 group-hover/form:opacity-100 data-popup-open:opacity-100" />
      </div>
      <div className="flex flex-col gap-2.5 border-t border-row-line px-4 pt-3.5 pb-4">
        <StatusBadge live={form.isPublished} />
        <Link href={`/builder/${form.id}`} className="min-h-[38px] text-[14.5px] leading-snug font-extrabold wrap-anywhere text-foreground outline-none after:absolute after:inset-0 hover:no-underline focus-visible:after:ring-3 focus-visible:after:ring-ring/20">
          {form.title}
        </Link>
        <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <InboxIcon className="size-4" />
            <b className="font-bold text-foreground tabular-nums">{form.isPublished ? form.submissionCount.toLocaleString() : "—"}</b>
          </span>
          <span>{form.isPublished ? timeAgo(form.updatedAt) : `Edited ${timeAgo(form.updatedAt).toLowerCase()}`}</span>
        </div>
      </div>
    </div>
  );
}
