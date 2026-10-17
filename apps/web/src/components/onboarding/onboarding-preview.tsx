import { FileTextIcon, HouseIcon, InboxIcon, UsersIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Home", icon: HouseIcon },
  { label: "Forms", icon: FileTextIcon },
  { label: "Responses", icon: InboxIcon },
  { label: "Team", icon: UsersIcon },
];

const initials = (s: string) => {
  const w = s.trim().split(/\s+/).filter(Boolean);
  return w.length ? (w[0][0] + (w[1]?.[0] ?? "")).toUpperCase() : "?";
};

// Static mock of the workspace that updates as the user types.
export function OnboardingPreview({ userName, workspaceName }: { userName: string; workspaceName: string }) {
  const ws = workspaceName.trim();
  const first = userName.trim().split(/\s+/)[0] || "there";

  return (
    <div className="hidden min-h-screen items-center justify-center overflow-hidden bg-sidebar px-8 py-10 lg:flex">
      <div className="flex w-full max-w-140 flex-col gap-3" aria-hidden>
        <span className="text-[11.5px] font-extrabold tracking-[0.08em] text-muted-foreground">YOUR WORKSPACE · PREVIEW</span>
        <div className="grid min-h-105 grid-cols-[150px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col gap-3.5 border-r border-border bg-background px-2.5 py-3.5">
            <div className="flex items-center gap-2 px-1">
              <span className="flex size-6.5 flex-none items-center justify-center rounded-[7px] bg-primary text-[11px] font-extrabold text-primary-foreground">{ws ? initials(ws) : "?"}</span>
              <span className={cn("line-clamp-2 text-[12.5px] leading-tight font-extrabold", !ws && "text-ink-3")}>{ws || "Your workspace"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {NAV.map(({ label, icon: Icon }, i) => (
                <span key={label} className={cn("flex h-7 items-center gap-2 rounded-[7px] px-2 text-xs font-bold", i === 0 ? "bg-accent text-primary-hover" : "text-ink-2")}>
                  <Icon className="size-3.25" />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3.5 p-4.5">
            <span className="font-heading text-base font-semibold tracking-[-0.02em]">Welcome, {first}</span>
            <div className="flex flex-col rounded-xl border border-border">
              <div className="flex items-center gap-2 rounded-t-xl border-b border-border bg-background px-3.5 py-3">
                <span className="flex-1 truncate text-[13px] font-extrabold">Your first form</span>
                <span className="rounded-[5px] bg-highlight-soft px-1.5 py-0.75 text-[10.5px] font-extrabold tracking-[0.06em] text-destructive">DRAFT</span>
              </div>
              <div className="flex flex-col px-3.5 pt-1.5 pb-2.5">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={cn("flex items-center gap-2.5 py-2", i && "border-t border-border")}>
                    <span className="size-5.5 flex-none rounded-md bg-neutral-soft" />
                    <span className="h-2 w-2/3 rounded-sm bg-neutral-soft" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
