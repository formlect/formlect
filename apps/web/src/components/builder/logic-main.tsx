"use client";

import { CopyIcon, EyeIcon, FilterIcon, GitBranchIcon, InfoIcon, PlusIcon, Trash2Icon, TriangleAlertIcon, XIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { condText, opsFor, valKind } from "./logic";
import { type RuleAction } from "./model";
import type { Builder } from "./use-builder";
import { field } from "./panel-styles";
import { Select } from "./panel-select";

export function LogicMain({ b }: { b: Builder }) {
  const { S, a } = b;
  const ix = (id: string) => S.fields.findIndex((f) => f.id === id);
  const short = (s: string) => ((s || "Untitled").length > 40 ? (s || "Untitled").slice(0, 40) + "…" : s || "Untitled");
  const fieldOpts = S.fields.map((f, i) => ({ v: f.id, label: `Q${i + 1} · ${short(f.label)}` }));
  const fl = S.lgFilter ? S.fields.find((f) => f.id === S.lgFilter) : undefined;
  const rules = S.rules.filter((r) => !S.lgFilter || r.target === S.lgFilter || r.conds.some((c) => c.q === S.lgFilter));
  const ACT: Record<RuleAction, string> = { show: "Show", hide: "Hide", jump: "Skip to", require: "Require" };

  return (
    <main className="min-h-0 overflow-auto bg-neutral-soft/60 px-6 pt-8 pb-[120px]">
      <div className="mx-auto flex max-w-[820px] flex-col gap-3.5">
        <div className="mb-1 flex flex-wrap items-end justify-between gap-4">
          <div className="flex max-w-[520px] flex-col gap-1">
            <h1 className="m-0 font-heading text-[26px] font-semibold tracking-[-0.02em]">Logic</h1>
            <p className="m-0 text-[14.5px] leading-[1.55] text-ink-2">Show, hide, skip or require questions based on earlier answers. Rules run live while people fill out the form.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="h-[38px] rounded-[10px]" onClick={a.testLogic}><EyeIcon />Test in preview</Button>
            <Button className="h-[38px] rounded-[10px]" onClick={a.addRule}><PlusIcon />Add rule</Button>
          </div>
        </div>

        {fl && (
          <div className="flex animate-fl-rise items-center gap-2.5 rounded-[11px] bg-accent py-2 pr-2 pl-3.5 text-[13.5px] text-sidebar-foreground">
            <FilterIcon className="size-4 text-primary" />
            <span className="min-w-0 flex-1 truncate">Rules involving <b className="text-foreground">Q{ix(fl.id) + 1} · {fl.label}</b></span>
            <button type="button" onClick={() => b.set({ lgFilter: null })} className="h-7 cursor-pointer rounded-[7px] border-0 bg-card px-2.5 text-[12.5px] font-bold">Show all</button>
          </div>
        )}

        {rules.map((r) => {
          const n = S.rules.indexOf(r) + 1;
          const c0 = r.conds[0];
          const src = c0 ? ix(c0.q) : -1;
          const ti = r.target === "__end" ? S.fields.length : ix(r.target);
          let warn = "";
          if (r.conds.some((c) => ix(c.q) < 0) || ti < 0) warn = "A question in this rule was deleted. Pick another one.";
          else if (r.conds.some((c) => c.q === r.target)) warn = "A rule can’t change the question it depends on.";
          else if (r.action === "jump" && ti <= src) warn = "Skips can only go forward in the form.";
          else if (r.action === "show" && ti < src) warn = "This question comes before the one it depends on, so it will stay hidden.";
          const summary = `${ACT[r.action]} ${r.target === "__end" ? "end of form" : ti >= 0 ? `Q${ti + 1}` : "…"} when ${c0 ? condText(S.fields, S.fields[src], c0) : "…"}${r.conds.length > 1 ? (r.join === "any" ? " or " : " and ") + (r.conds.length - 1) + " more" : ""}`;
          return (
            <div key={r.id} className={cn("rounded-2xl border border-border bg-card transition-opacity duration-150", !r.on && "opacity-60", S.justRule === r.id && "animate-fl-in")}>
              <div className="flex items-center gap-2.5 border-b border-row-line py-2.5 pr-2.5 pl-4">
                <span className="font-mono text-[11.5px] whitespace-nowrap text-ink-3">RULE {n}</span>
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink-2">{summary}</span>
                <Switch checked={r.on} onCheckedChange={(v) => a.updRule(r.id, { on: v })} aria-label="Turn rule on or off" />
                <button type="button" title="Duplicate rule" aria-label="Duplicate rule" onClick={() => a.dupRule(r.id)} className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"><CopyIcon className="size-4" /></button>
                <button type="button" title="Delete rule" aria-label="Delete rule" onClick={() => a.delRule(r.id)} className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive-soft hover:text-destructive"><Trash2Icon className="size-4" /></button>
              </div>
              <div className="flex flex-col gap-2 px-4 pt-3.5 pb-4">
                {r.conds.map((c, j) => {
                  const f = S.fields.find((x) => x.id === c.q);
                  const k = valKind(f, c.op);
                  const prefix = j === 0 ? "When" : r.join === "any" ? "or" : "and";
                  return (
                    <div key={j} className="flex flex-wrap items-center gap-2">
                      <button type="button" disabled={j === 0} title={j === 0 ? undefined : "Switch between and / or"} onClick={() => a.updRule(r.id, { join: r.join === "any" ? "all" : "any" })} className={cn("h-9 w-[58px] flex-none rounded-lg border-0 text-[12.5px] font-extrabold", j === 0 ? "cursor-default bg-foreground text-background" : "cursor-pointer bg-secondary text-sidebar-foreground")}>{prefix}</button>
                      <Select label="Question" className="flex-[1_1_220px]" value={c.q} onChange={(v) => a.setCond(r.id, j, { q: v, reset: true })} options={fieldOpts} />
                      <Select label="Condition" className="flex-[0_1_160px]" value={c.op} onChange={(v) => a.setCond(r.id, j, { op: v })} options={opsFor(f?.type ?? "short").map(([v, label]) => ({ v, label }))} />
                      {k === "opt" && <Select label="Answer" className="flex-[1_1_160px]" value={c.v} onChange={(v) => a.setCond(r.id, j, { v })} options={(f?.options ?? []).map((label, q) => ({ v: String(q), label }))} />}
                      {k === "num" && <input type="number" aria-label="Value" value={c.v} onChange={(e) => a.setCond(r.id, j, { v: e.target.value })} className="h-9 w-[84px] rounded-[9px] border border-input px-2.5 text-[13.5px] font-bold outline-none focus:border-primary focus:ring-3 focus:ring-ring/20" />}
                      {k === "text" && <input aria-label="Value" value={c.v} onChange={(e) => a.setCond(r.id, j, { v: e.target.value })} placeholder="text" className={cn(field, "min-w-0 flex-[1_1_140px]")} />}
                      {r.conds.length > 1 && <button type="button" aria-label="Remove condition" onClick={() => a.updRule(r.id, { conds: r.conds.filter((_, q) => q !== j) })} className="flex size-[30px] flex-none cursor-pointer items-center justify-center rounded-lg text-ink-3 hover:bg-secondary hover:text-foreground"><XIcon className="size-4" /></button>}
                    </div>
                  );
                })}
                <button type="button" onClick={() => a.updRule(r.id, { conds: [...r.conds, a.newCond(c0 ? c0.q : S.fields[0].id)] })} className="ml-[66px] flex h-7 cursor-pointer items-center gap-1.5 self-start rounded-[7px] border-0 bg-transparent px-2 text-[12.5px] font-bold text-primary hover:bg-tint"><PlusIcon className="size-4" />Add condition</button>
                <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border pt-2.5">
                  <span className="flex h-9 w-[58px] flex-none items-center justify-center rounded-lg bg-primary text-[12.5px] font-extrabold text-primary-foreground">Then</span>
                  <Select label="Action" className="flex-[0_1_140px]" value={r.action} onChange={(v) => a.updRule(r.id, { action: v as RuleAction, target: v !== "jump" && r.target === "__end" ? (S.fields[src + 1] ?? S.fields[0]).id : r.target })} options={(Object.keys(ACT) as RuleAction[]).map((v) => ({ v, label: ACT[v] }))} />
                  <Select label="Target question" className="flex-[1_1_260px]" value={r.target} onChange={(v) => a.updRule(r.id, { target: v })} options={r.action === "jump" ? [...fieldOpts, { v: "__end", label: "End of form" }] : fieldOpts} />
                </div>
                {warn && (
                  <div className="mt-0.5 flex items-start gap-2.5 rounded-[10px] border border-destructive-border bg-destructive-soft px-3 py-[9px] text-[13px] font-semibold text-highlight-foreground">
                    <TriangleAlertIcon className="mt-0.5 size-4 flex-none text-destructive" />
                    {warn}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!rules.length && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-input p-10 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary"><GitBranchIcon className="size-5" /></span>
            <span className="text-[15px] font-extrabold">{S.lgFilter ? "No rules for this question yet" : "No rules yet"}</span>
            <span className="max-w-[360px] text-[13.5px] leading-normal text-muted-foreground">For example: show a follow-up question only when someone answers “Yes”.</span>
            <Button variant="soft" className="mt-1.5 h-9" onClick={a.addRule}><PlusIcon />Add rule</Button>
          </div>
        )}

        <div className="flex gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-[13px] leading-[1.55] text-ink-2">
          <InfoIcon className="mt-0.5 size-4 flex-none text-primary" />
          <span>A question with a <b className="text-foreground">Show</b> rule stays hidden until a rule matches. Hidden questions are skipped and never required. Click <b className="text-foreground">and</b> / <b className="text-foreground">or</b> to switch how conditions combine.</span>
        </div>
      </div>
    </main>
  );
}
