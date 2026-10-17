"use client";

import { CopyIcon, HashIcon, MousePointerClickIcon, PlusIcon, Trash2Icon, XIcon, StarIcon, ListIcon, TagsIcon, RectangleHorizontalIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { slug } from "./logic";
import { groupName, type Look, T, TYPE_KEYS, typeDef, type Field } from "./model";
import type { Builder } from "./use-builder";
import { field, lbl } from "./panel-styles";
import { Seg } from "./seg";
import { Tile } from "./tile";
import { Section } from "./section";

export function SettingsPanel({ b }: { b: Builder }) {
  const { a, selected: f } = b;
  if (!f)
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-muted-foreground"><MousePointerClickIcon className="size-5" /></span>
        <span className="text-[14.5px] font-extrabold">Select a question</span>
        <span className="text-[13px] leading-normal text-muted-foreground">Click any question in the form to edit its settings here.</span>
      </div>
    );
  const t = typeDef(f.type);
  const Icon = t.i;
  const fam = TYPE_KEYS.filter((k) => T[k].g === t.g);
  const idx = b.S.fields.indexOf(f);
  const up = (p: Partial<Field>, tag: string) => a.upd(f.id, p, tag + f.id);
  const optRow = (v: string, j: number) => (
    <div key={j} className="flex items-center gap-1.5">
      <span className="flex size-5 flex-none items-center justify-center rounded-[5px] bg-secondary font-mono text-[10.5px] text-muted-foreground">{String.fromCharCode(65 + j)}</span>
      <input
        data-opt={`p-${f.id}-${j}`}
        value={v}
        aria-label={`Option ${j + 1}`}
        onChange={(e) => up({ options: f.options!.map((x, k) => (k === j ? e.target.value : x)) }, "o" + j)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); a.addOpt(f.id, j + 1, "p"); } }}
        className="h-[34px] min-w-0 flex-1 rounded-lg border border-border px-[9px] text-[13.5px] outline-none focus:border-primary focus:ring-3 focus:ring-ring/20"
      />
      <button type="button" aria-label="Remove option" disabled={f.options!.length <= 1} onClick={() => a.upd(f.id, { options: f.options!.filter((_, k) => k !== j) })} className="flex size-7 cursor-pointer items-center justify-center rounded-[7px] text-ink-3 hover:bg-secondary hover:text-foreground disabled:cursor-default disabled:opacity-40"><XIcon className="size-4" /></button>
    </div>
  );
  const looks: [Look, string, LucideIcon][] = [["cards", "Cards", RectangleHorizontalIcon], ["list", "List", ListIcon], ["pills", "Pills", TagsIcon]];
  const num = (k: "min" | "max", label: string) => (
    <div className="flex flex-col gap-1.5">
      <label className={lbl}>{label}</label>
      <input type="number" value={f[k] ?? (k === "min" ? 0 : 10)} onChange={(e) => up({ [k]: +e.target.value }, k)} className={field} />
    </div>
  );
  return (
    <div className="flex flex-col">
      <Section>
        <div className="flex items-center gap-2.5">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-accent text-primary"><Icon className="size-4" /></span>
          <div className="flex flex-col">
            <span className="text-[14.5px] font-extrabold">{t.n}</span>
            <span className="text-xs text-ink-3">{groupName(t.g)} · question {idx + 1}</span>
          </div>
        </div>
        {fam.length > 1 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-muted-foreground">Change to</span>
            <div className="flex flex-wrap gap-1.5">
              {fam.map((k) => {
                const I = T[k].i;
                return (
                  <Tile key={k} on={k === f.type} onClick={() => a.convert(f.id, k)} className="flex h-[30px] items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-bold whitespace-nowrap">
                    <I className="size-4" />
                    {T[k].n}
                  </Tile>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      <Section>
        <div className="flex flex-col gap-1.5">
          <label className={lbl} htmlFor="sf-label">Question</label>
          <textarea id="sf-label" value={f.label} onChange={(e) => up({ label: e.target.value }, "l")} rows={2} className="field-sizing-content min-h-10 resize-none overflow-hidden rounded-[9px] border border-input px-2.5 py-2 text-sm leading-[1.45] outline-none focus:border-primary focus:ring-3 focus:ring-ring/20" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={lbl} htmlFor="sf-help">Help text</label>
          <input id="sf-help" value={f.help} onChange={(e) => up({ help: e.target.value }, "h")} placeholder="Shown under the question" className={field} />
        </div>
        {["short", "long", "email", "phone", "url", "number"].includes(f.type) && (
          <div className="flex flex-col gap-1.5">
            <label className={lbl} htmlFor="sf-ph">Placeholder</label>
            <input id="sf-ph" value={f.ph} onChange={(e) => up({ ph: e.target.value }, "p")} className={field} />
          </div>
        )}
      </Section>

      {t.opts && (
        <Section>
          <div className="flex items-center justify-between"><span className={lbl}>Options</span><span className="text-xs text-ink-3">{f.options?.length ?? 0} options</span></div>
          <div className="flex flex-col gap-1">{(f.options ?? []).map(optRow)}</div>
          <button type="button" onClick={() => a.addOpt(f.id, undefined, "p")} className="flex h-[30px] cursor-pointer items-center gap-1.5 self-start rounded-lg bg-accent px-2.5 text-[12.5px] font-bold text-accent-foreground hover:bg-accent-hover"><PlusIcon className="size-4" />Add option</button>
          {f.type !== "select" && (
            <>
              <span className={cn(lbl, "mt-1")}>Appearance</span>
              <div className="grid grid-cols-3 gap-1.5">
                {looks.map(([id, name, I]) => (
                  <Tile key={id} on={f.look === id} onClick={() => a.upd(f.id, { look: id })} className="flex h-14 flex-col items-center justify-center gap-1 rounded-[10px] text-xs font-extrabold"><I className="size-4" />{name}</Tile>
                ))}
              </div>
            </>
          )}
        </Section>
      )}

      {f.type === "rating" && (
        <Section className="gap-2.5">
          <span className={lbl}>Scale</span>
          <Seg value={f.max ?? 5} onChange={(n) => a.upd(f.id, { max: n })} items={[3, 5, 10].map((n) => ({ v: n, label: `1–${n}` }))} />
          <span className={lbl}>Appearance</span>
          <div className="grid grid-cols-2 gap-1.5">
            {([["stars", "Stars", StarIcon], ["numbers", "Numbers", HashIcon]] as const).map(([id, name, I]) => (
              <Tile key={id} on={f.rstyle === id} onClick={() => a.upd(f.id, { rstyle: id })} className="flex h-12 items-center justify-center gap-1.5 rounded-[10px] text-[12.5px] font-extrabold"><I className="size-4" />{name}</Tile>
            ))}
          </div>
        </Section>
      )}

      {f.type === "range" && (
        <Section className="grid grid-cols-2 gap-2.5">
          {num("min", "Min")}
          {num("max", "Max")}
          <div className="flex flex-col gap-1.5"><label className={lbl}>Min label</label><input value={f.minLabel} onChange={(e) => up({ minLabel: e.target.value }, "ml")} className={field} /></div>
          <div className="flex flex-col gap-1.5"><label className={lbl}>Max label</label><input value={f.maxLabel} onChange={(e) => up({ maxLabel: e.target.value }, "xl")} className={field} /></div>
        </Section>
      )}

      {f.type === "number" && (
        <Section className="gap-1.5">
          <label className={lbl} htmlFor="sf-unit">Unit</label>
          <input id="sf-unit" value={f.unit} onChange={(e) => up({ unit: e.target.value }, "u")} placeholder="e.g. people, km, KES" className={field} />
        </Section>
      )}

      {t.g === "media" && (
        <Section className="gap-2.5">
          <span className={lbl}>Files allowed</span>
          <Seg value={f.files} onChange={(n) => a.upd(f.id, { files: n })} items={[1, 3, 5].map((n) => ({ v: n, label: n === 1 ? "1 file" : `Up to ${n}` }))} />
        </Section>
      )}

      <Section className="gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="sf-req" className="flex cursor-pointer flex-col">
            <span className="text-[13.5px] font-bold">Required</span>
            <span className="text-xs text-ink-3">Respondents must answer</span>
          </label>
          <Switch id="sf-req" checked={f.required} onCheckedChange={(v) => a.upd(f.id, { required: v })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={lbl} htmlFor="sf-key">Data key</label>
          <input id="sf-key" value={f.key || slug(f.label)} onChange={(e) => up({ key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 60) }, "k")} className={cn(field, "font-mono text-[12.5px] text-sidebar-foreground")} />
          <span className="text-xs text-ink-3">Column name in exports, the API and webhooks.</span>
        </div>
      </Section>

      <div className="flex gap-2 p-4">
        <Button variant="outline" size="sm" className="h-9 flex-1" onClick={() => a.dup(f.id)}><CopyIcon />Duplicate</Button>
        <Button variant="outline" size="sm" className="h-9 flex-1 border-destructive-border text-destructive hover:bg-destructive-soft" onClick={() => a.del(f.id)}><Trash2Icon />Delete</Button>
      </div>
    </div>
  );
}
