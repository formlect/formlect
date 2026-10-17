"use client";

import { AppWindowIcon, BanIcon, PaintBucketIcon, PaletteIcon, RotateCcwIcon, SparkleIcon, SquareDashedIcon, SquareIcon, SquircleIcon, CircleIcon, ImageIcon, CheckIcon, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { ACCENTS, FONTS, type FontKey, PRESETS, type PresetKey, type Radius } from "./model";
import type { Builder } from "./use-builder";
import { field, cap } from "./panel-styles";
import { Seg } from "./seg";
import { Tile } from "./tile";
import { Section } from "./section";
import { Aside } from "./aside";
import { AsideHead } from "./aside-head";

export function DesignPanel({ b }: { b: Builder }) {
  const { S, a } = b;
  const d = S.design;
  const pa = PRESETS[d.preset].a;
  const radii: { v: Radius; label: string; icon: LucideIcon }[] = [{ v: "sharp", label: "Sharp", icon: SquareIcon }, { v: "soft", label: "Soft", icon: SquircleIcon }, { v: "round", label: "Round", icon: CircleIcon }];
  const covers = [{ v: "none", label: "None", icon: BanIcon }, { v: "color", label: "Color", icon: PaintBucketIcon }, { v: "image", label: "Image", icon: ImageIcon }] as const;
  const btns = [{ v: "filled", label: "Filled", icon: SquareIcon }, { v: "outline", label: "Outline", icon: SquareDashedIcon }] as const;
  const layouts = [
    { v: "classic", name: "Classic", desc: "All questions on one page", lines: [["6px", "60%", "bg-ink-3"], ["9px", "100%", "bg-card"], ["9px", "100%", "bg-card"]] },
    { v: "focus", name: "One at a time", desc: "Focused, Enter to continue", lines: [["6px", "75%", "bg-ink-3"], ["10px", "100%", "bg-card"], ["7px", "30%", "bg-primary"]] },
  ] as const;
  return (
    <Aside>
      <AsideHead icon={PaletteIcon} title="Design" right={<button type="button" onClick={() => a.setDesign({ preset: "formlect", accent: null, font: "modern", radius: "soft", layout: "classic", cover: "none", btn: "filled", btnText: "Submit" })} className="flex cursor-pointer items-center gap-[5px] border-0 bg-transparent text-[12.5px] font-bold text-muted-foreground hover:text-foreground"><RotateCcwIcon className="size-4" />Reset</button>} />
      <div className="min-h-0 flex-1 overflow-auto">
        <Section>
          <button type="button" role="switch" aria-checked={false} onClick={() => a.setLanding(true)} className="flex w-full cursor-pointer items-start gap-3 rounded-[14px] border-[1.5px] border-dashed border-primary-300 bg-tint-soft p-3.5 text-left transition-all duration-150 hover:border-solid hover:border-primary hover:bg-tint">
            <span className="flex size-9 flex-none items-center justify-center rounded-[10px] border border-accent-hover bg-card text-primary"><AppWindowIcon className="size-[17px]" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="text-sm font-extrabold">Turn this into a page</span>
              <span className="text-[12.5px] leading-[1.45] text-ink-2">Add your logo, a background, an intro and FAQ around the form.</span>
            </span>
            <span className="relative mt-0.5 h-5 w-[34px] flex-none rounded-full bg-input"><span className="absolute top-[3px] left-[3px] size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)]" /></span>
          </button>
        </Section>
        <Section className="gap-2.5">
          <span className={cap}>THEME</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PRESETS) as PresetKey[]).map((k) => {
              const p = PRESETS[k];
              const on = d.preset === k;
              return (
                <button key={k} type="button" aria-pressed={on} onClick={() => a.setDesign({ preset: k, accent: null })} className={cn("flex cursor-pointer flex-col gap-1.5 rounded-xl border-[1.5px] bg-card p-[5px] text-left transition-all duration-150 hover:border-primary-300", on ? "border-primary shadow-[0_0_0_3px_var(--accent)]" : "border-border")}>
                  <div className="flex h-[60px] rounded-lg px-3 pt-2" style={{ background: p.page }}>
                    <div className="flex flex-1 flex-col gap-1 rounded-t-md p-2" style={{ background: p.card }}>
                      <span className="h-1 w-3/5 rounded-[2px] opacity-85" style={{ background: p.ink }} />
                      <span className="h-2.5 rounded-[3px] border" style={{ borderColor: p.line }} />
                      <span className="h-[9px] w-2/5 rounded-[3px]" style={{ background: p.a }} />
                    </div>
                  </div>
                  <span className="flex items-center justify-between px-1 pb-[3px] text-[12.5px] font-extrabold">{p.name}<CheckIcon className="size-4 text-primary" style={{ opacity: on ? 1 : 0 }} /></span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section className="gap-2.5">
          <span className={cap}>ACCENT COLOR</span>
          <div className="flex flex-wrap gap-2 p-0.5">
            {ACCENTS.map((c) => {
              const on = d.accent === c;
              const col = c ?? pa;
              const I = c ? CheckIcon : SparkleIcon;
              return (
                <button key={c ?? "default"} type="button" title={c ? c.toUpperCase() : "Theme default"} aria-label={c ? c.toUpperCase() : "Theme default"} aria-pressed={on} onClick={() => a.setDesign({ accent: c })} className="flex size-[30px] cursor-pointer items-center justify-center rounded-full border-0 text-white transition-[box-shadow,transform] duration-150 hover:scale-[1.08]" style={{ background: col, boxShadow: on ? `0 0 0 2px var(--card), 0 0 0 4px ${col}` : "none" }}>
                  <I className="size-[13px]" style={{ opacity: on ? 1 : c ? 0 : 0.85 }} />
                </button>
              );
            })}
          </div>
        </Section>

        <Section className="gap-2.5">
          <span className={cap}>FONT</span>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FONTS) as FontKey[]).map((k) => {
              const F = FONTS[k];
              return (
                <Tile key={k} on={d.font === k} onClick={() => a.setDesign({ font: k })} className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left">
                  <span className="text-2xl leading-[1.1] text-foreground" style={{ fontFamily: F.hf, fontWeight: F.hw }}>Aa</span>
                  <span className="text-[12.5px] font-extrabold text-foreground">{F.name}</span>
                  <span className="text-[11px] font-normal text-ink-3">{F.desc}</span>
                </Tile>
              );
            })}
          </div>
        </Section>

        <Section className="gap-2.5">
          <span className={cap}>LAYOUT</span>
          <div className="grid grid-cols-2 gap-2">
            {layouts.map((l) => (
              <Tile key={l.v} on={d.layout === l.v} onClick={() => a.setDesign({ layout: l.v })} className="flex flex-col gap-2 rounded-xl p-2 text-left">
                <div className="flex h-14 flex-col justify-center gap-1 rounded-[7px] bg-neutral-soft px-3.5">
                  {l.lines.map(([h, w, c], i) => <span key={i} className={cn("rounded-[2px]", c)} style={{ height: h, width: w }} />)}
                </div>
                <div className="flex flex-col px-0.5">
                  <span className="text-[12.5px] font-extrabold text-foreground">{l.name}</span>
                  <span className="text-[11px] leading-[1.35] font-normal text-ink-3">{l.desc}</span>
                </div>
              </Tile>
            ))}
          </div>
        </Section>

        <Section className="gap-2.5"><span className={cap}>CORNERS</span><Seg value={d.radius} onChange={(v) => a.setDesign({ radius: v })} items={radii} /></Section>
        <Section className="gap-2.5"><span className={cap}>COVER</span><Seg value={d.cover} onChange={(v) => a.setDesign({ cover: v })} items={[...covers]} /></Section>
        <Section className="gap-2.5">
          <span className={cap}>BUTTON</span>
          <input value={d.btnText} onChange={(e) => a.setDesign({ btnText: e.target.value.slice(0, 40) })} placeholder="Submit" aria-label="Button text" className={field} />
          <Seg value={d.btn} onChange={(v) => a.setDesign({ btn: v })} items={[...btns]} />
        </Section>
      </div>
    </Aside>
  );
}
