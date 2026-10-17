"use client";

import { CornerDownRightIcon, EyeOffIcon, GitBranchIcon, WorkflowIcon, AsteriskIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { T } from "./model";
import type { Builder } from "./use-builder";
import { Aside } from "./aside";
import { AsideHead } from "./aside-head";

export function FlowPanel({ b }: { b: Builder }) {
  const { S } = b;
  const active = S.rules.filter((r) => r.on).length;
  return (
    <Aside>
      <AsideHead icon={WorkflowIcon} title="Flow" right={<span className="text-xs text-ink-3">{active} active {active === 1 ? "rule" : "rules"}</span>} />
      <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2">
        {S.fields.map((f, i) => {
          const inc = S.rules.filter((r) => r.on && r.target === f.id);
          const out = S.rules.filter((r) => r.on && r.conds.some((c) => c.q === f.id));
          const tags: { t: string; I: LucideIcon }[] = [];
          if (inc.some((r) => r.action === "show" || r.action === "hide")) tags.push({ t: "Conditional", I: EyeOffIcon });
          if (inc.some((r) => r.action === "require")) tags.push({ t: "Sometimes required", I: AsteriskIcon });
          if (out.some((r) => r.action === "jump")) tags.push({ t: "Skips ahead", I: CornerDownRightIcon });
          if (out.length && !tags.length) tags.push({ t: `Drives ${out.length} ${out.length === 1 ? "rule" : "rules"}`, I: GitBranchIcon });
          const on = S.lgFilter === f.id;
          const TI = T[f.type].i;
          return (
            <button key={f.id} type="button" aria-pressed={on} onClick={() => b.set({ lgFilter: on ? null : f.id })} className={cn("flex w-full cursor-pointer items-start gap-2.5 rounded-[10px] border-[1.5px] px-2.5 py-[9px] text-left transition-colors duration-100 hover:bg-background", on ? "border-primary bg-tint" : "border-transparent bg-transparent")}>
              <span className="mt-0.5 w-[18px] flex-none font-mono text-[11.5px] text-primary">{i + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <span className="line-clamp-2 text-[13px] leading-[1.35] font-bold">{f.label || "Untitled"}</span>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map(({ t, I }) => <span key={t} className="flex items-center gap-1 rounded-[5px] bg-accent px-1.5 py-px text-[11px] font-extrabold text-accent-foreground"><I className="size-3" />{t}</span>)}
                  </div>
                )}
              </div>
              <TI className="mt-0.5 size-3.5 flex-none text-ink-3" />
            </button>
          );
        })}
      </div>
      <div className="border-t border-neutral-soft px-4 py-3 text-[12.5px] leading-normal text-muted-foreground">Click a question to see only its rules.</div>
    </Aside>
  );
}
