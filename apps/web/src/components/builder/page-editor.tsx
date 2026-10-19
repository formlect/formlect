"use client";

import {
  AppWindowIcon, ArrowLeftIcon, ArrowRightIcon, Building2Icon, CalendarClockIcon, CheckIcon, ChevronDownIcon, ClapperboardIcon, ClockIcon, DropletIcon, EyeIcon, EyeOffIcon,
  FileTextIcon, GlobeIcon, HeadingIcon, ImageIcon, LanguagesIcon, LayersIcon, LayoutListIcon, LockIcon, MessagesSquareIcon, MonitorIcon, MousePointerClickIcon, PaintBucketIcon,
  PaletteIcon, PanelBottomIcon, PanelTopIcon, PencilIcon, PlusIcon, ShapesIcon, ShieldCheckIcon, SmartphoneIcon, SquareIcon, Trash2Icon, UsersIcon, type LucideIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import { cn } from "cn";
import { Switch } from "@/components/ui/switch";
import { derive, BGS, PAGE_ACCENTS, secName, SECTIONS, type PageLayout, type SectionId, TEXTURES, texFill } from "./page-model";
import { cap } from "./panel-styles";
import { Section } from "./section";
import { typeDef } from "./model";
import type { Builder } from "./use-builder";

const SEC_ICON: Record<SectionId, LucideIcon> = { header: PanelTopIcon, hero: HeadingIcon, form: FileTextIcon, deadline: CalendarClockIcon, about: Building2Icon, why: ShieldCheckIcon, faq: MessagesSquareIcon, footer: PanelBottomIcon };
const HEAD = { fontFamily: "var(--font-sora)", fontWeight: 600 } as const;

const rect = (l: number, t: number, w: number, h: number, c: string, bd = "0", r = "3px"): CSSProperties => ({ position: "absolute", left: `${l}%`, top: `${t}%`, width: `${w}%`, height: `${h}%`, background: c, border: bd, borderRadius: r });

export function PageEditor({ b }: { b: Builder }) {
  const { S, a } = b;
  const P = S.page;
  const set = a.setPage;
  const mob = P.device === "mobile";
  const ed = !P.preview;
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [mw, setMw] = useState(900);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    if (!scrollEl) return;
    const ro = new ResizeObserver((es) => setMw(Math.round(es[0].contentRect.width)));
    ro.observe(scrollEl);
    return () => ro.disconnect();
  }, [scrollEl]);
  const compact = !mob && mw - 48 < 760;
  const { pg, ink, ic, fc, accent, col } = derive(P, mob, compact);
  const bgC = P.bg;
  const cardM = "#fff";
  const cardB = "1px solid #ddd8d3";

  const select = (id: SectionId) => { if (!P.preview) set({ sel: id }); };
  const toggleSec = (id: SectionId) => {
    if (id === "form") return;
    set({ on: { ...P.on, [id]: !P.on[id] }, sel: id === P.sel && P.on[id] ? null : P.sel });
  };
  const setOrg = (k: keyof typeof P.org) => (v: string) => set({ org: { ...P.org, [k]: v } });
  const sp = (id: SectionId, offset: number, radius = 12): { "data-sec": SectionId; onClick: (e: React.MouseEvent) => void; onMouseEnter: () => void; onMouseLeave: () => void; style: CSSProperties } => ({
    "data-sec": id,
    onClick: (e) => { e.stopPropagation(); select(id); },
    onMouseEnter: () => { if (ed && P.hover !== id) set({ hover: id }); },
    onMouseLeave: () => { if (P.hover) set({ hover: null }); },
    style: { position: "relative", borderRadius: radius, outlineOffset: offset, cursor: ed ? "pointer" : "auto", outline: !ed ? "none" : P.sel === id ? "2px solid #7c63ff" : P.hover === id ? "1.5px dashed #9b8af5" : "1.5px dashed transparent" },
  });

  const dl = P.org.deadline ? new Date(`${P.org.deadline}T23:59`) : null;
  const days = dl ? Math.ceil((dl.getTime() - now) / 864e5) : null;
  const deadlineText = dl ? dl.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const daysLeft = days === null ? "" : days < 0 ? "Closed" : days === 0 ? "Last day" : `${days} days left`;
  const url = b.link.replace(/^https?:\/\//, "");
  const year = new Date(now).getFullYear();

  const qs = S.fields.slice(0, 3);
  const answered = qs.filter((f) => P.ans[f.id] !== undefined && P.ans[f.id] !== "").length;
  const formProg = qs.length ? (answered / qs.length) * 100 : 0;
  const mins = Math.max(1, Math.round(S.fields.length * 0.4));
  const glassNote = P.card === "glass";
  const layDefs: [PageLayout, string, CSSProperties[]][] = [
    ["cover", "Cover", [rect(0, 0, 100, 46, bgC, "0", "0"), rect(28, 14, 44, 6, "rgba(255,255,255,.7)"), rect(24, 30, 52, 62, cardM, cardB, "4px")]],
    ["split", "Split", [rect(0, 0, 44, 100, bgC, "0", "0"), rect(8, 22, 28, 6, "rgba(255,255,255,.7)"), rect(54, 14, 38, 72, cardM, cardB, "4px")]],
    ["hero", "Hero", [rect(0, 0, 100, 72, bgC, "0", "0"), rect(7, 26, 34, 7, "rgba(255,255,255,.7)"), rect(7, 38, 26, 4, "rgba(255,255,255,.45)"), rect(54, 14, 38, 74, cardM, cardB, "4px")]],
    ["immersive", "Full-bleed", [rect(0, 0, 100, 100, bgC, "0", "0"), rect(30, 10, 40, 6, "rgba(255,255,255,.7)"), rect(26, 24, 48, 66, "rgba(255,255,255,.4)", "1px solid rgba(255,255,255,.6)", "4px")]],
  ];
  const swatch = (c: string, on: boolean, ringC: string) => ({ background: c, boxShadow: on ? `0 0 0 2px #fff, 0 0 0 4px ${ringC}` : "none" });

  const infoCard = (id: SectionId, Icon: LucideIcon, title: string, text: string) => (
    <div {...sp(id, 5, 16)} className="flex flex-col gap-2" style={{ ...sp(id, 5, 16).style, background: ic.bg, border: `1px solid ${ic.bd}`, padding: "20px 22px" }}>
      <span className="flex items-center gap-2 text-base" style={HEAD}><Icon className="size-4" style={{ color: ic.icon }} />{title}</span>
      <p className="m-0 text-[14.5px] leading-[1.6] text-pretty" style={{ color: ic.mut }}>{text}</p>
    </div>
  );

  const field_ = (f: (typeof qs)[number]) => {
    const t = typeDef(f.type);
    const v = P.ans[f.id];
    const star = f.required && <span style={{ color: accent }}> *</span>;
    const lab = <span className="text-[15px] font-bold">{f.label}{star}</span>;
    if (t.opts && f.type !== "select")
      return (
        <div key={f.id} className="flex flex-col gap-2.5">
          {lab}
          <div className="flex flex-wrap gap-2">
            {(f.options ?? []).slice(0, 4).map((o, i) => {
              const on = v === i;
              return (
                <button key={i} type="button" onClick={() => set({ ans: { ...P.ans, [f.id]: i } })} className="flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm font-bold transition-all duration-150 active:scale-[0.97]" style={{ borderColor: on ? accent : fc.fieldBd, background: on ? accent : fc.field, color: on ? "#fff" : fc.ink }}>
                  {on && <CheckIcon className="size-4" />}
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      );
    if (f.type === "rating" || f.type === "range")
      return (
        <div key={f.id} className="flex flex-col gap-2.5">
          {lab}
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const on = v === n;
              return (
                <button key={n} type="button" onClick={() => set({ ans: { ...P.ans, [f.id]: n } })} className="h-11 cursor-pointer rounded-[10px] border-[1.5px] text-[15px] font-extrabold tabular-nums transition-all duration-150 active:scale-95" style={{ borderColor: on ? accent : fc.fieldBd, background: on ? accent : fc.field, color: on ? "#fff" : fc.ink }}>{n}</button>
              );
            })}
          </div>
        </div>
      );
    return (
      <label key={f.id} className="flex flex-col gap-2">
        {lab}
        <input value={typeof v === "string" ? v : ""} onChange={(e) => set({ ans: { ...P.ans, [f.id]: e.target.value } })} placeholder={f.ph || "Your answer"} className="h-[46px] rounded-[11px] border-[1.5px] px-3.5 text-[15px] outline-none transition-[border-color,box-shadow] duration-150" style={{ borderColor: fc.fieldBd, background: fc.field, color: fc.ink }} onFocus={(e) => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px color-mix(in oklch, ${accent} 25%, transparent)`; }} onBlur={(e) => { e.currentTarget.style.borderColor = fc.fieldBd; e.currentTarget.style.boxShadow = "none"; }} />
      </label>
    );
  };

  const selId = P.sel;
  const dev = (k: "desktop" | "mobile", label: string, Icon: LucideIcon) => (
    <button key={k} type="button" title={label} aria-label={label} aria-pressed={P.device === k} onClick={() => set({ device: k })} className={cn("flex h-7 w-8.5 cursor-pointer items-center justify-center rounded-[7px] border-0 transition-all duration-150", P.device === k ? "bg-foreground text-background" : "bg-transparent text-muted-foreground")}><Icon className="size-4" /></button>
  );
  const seg = (items: { v: string; label: string; icon: LucideIcon }[], val: string, pick: (v: string) => void, off?: string[]) => (
    <div className="flex rounded-[9px] bg-secondary p-0.75">
      {items.map(({ v, label, icon: Icon }) => (
        <button key={v} type="button" disabled={off?.includes(v)} title={off?.includes(v) ? "Needs file storage, not available yet" : undefined} onClick={() => pick(v)} className={cn("flex h-7.5 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[7px] border-0 text-[12.5px] font-bold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45", v === val ? "bg-card text-foreground shadow-[0_1px_2px_rgb(27_23_36/0.1)]" : "bg-transparent text-muted-foreground")}><Icon className="size-4" />{label}</button>
      ))}
    </div>
  );
  const cardSeg = seg([{ v: "solid", label: "Solid", icon: SquareIcon }, { v: "glass", label: "Frosted", icon: DropletIcon }], P.card, (v) => set({ card: v as "solid" | "glass" }));
  const inp = (label: string, value: string, on: (v: string) => void, type = "text") => (
    <label className="flex flex-col gap-1.5 text-[13px] font-bold">{label}<input type={type} value={value} onChange={(e) => on(e.target.value)} className="h-9.5 rounded-[9px] border border-input px-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-3 focus:ring-ring/20" /></label>
  );
  const area = (label: string, value: string, on: (v: string) => void, rows: number) => (
    <label className="flex flex-col gap-1.5 text-[13px] font-bold">{label}<textarea value={value} rows={rows} onChange={(e) => on(e.target.value)} className="resize-y rounded-[9px] border border-input px-2.5 py-2 text-sm leading-normal font-medium outline-none focus:border-primary focus:ring-3 focus:ring-ring/20" /></label>
  );
  const switchRow = (label: string, on: boolean, flip: (v: boolean) => void) => (
    <div className="flex items-center gap-2.5 pt-0.5 text-[13.5px] font-bold"><Switch checked={on} onCheckedChange={flip} aria-label={label} className="h-5 w-8.5" />{label}</div>
  );

  return (
    <div className="grid min-h-0 grid-cols-[200px_minmax(0,1fr)_272px] min-[1100px]:grid-cols-[240px_minmax(0,1fr)_304px]">
      <aside className="flex min-h-0 flex-col border-r border-neutral-soft bg-card">
        <div className="flex h-11 flex-none items-center gap-2 border-b border-neutral-soft px-4 text-[13.5px] font-extrabold"><LayersIcon className="size-4 text-primary" />Page sections</div>
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto p-2">
          {SECTIONS.map(([id, name]) => {
            const Icon = SEC_ICON[id];
            const sel = P.sel === id;
            const TI = id === "form" ? LockIcon : P.on[id] ? EyeIcon : EyeOffIcon;
            return (
              <div key={id} role="button" tabIndex={0} onClick={() => select(id)} onKeyDown={(e) => { if (e.key === "Enter") select(id); }} className={cn("flex h-9.5 cursor-pointer items-center gap-2.5 rounded-[9px] pr-1.5 pl-2.5 transition-colors duration-100 hover:bg-background", sel ? "bg-tint text-primary" : "text-foreground", !P.on[id] && "opacity-45")}>
                <Icon className="size-3.75 w-4" />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold">{name}</span>
                <button type="button" title={id === "form" ? "Always shown" : P.on[id] ? "Hide section" : "Show section"} aria-label={id === "form" ? "Always shown" : P.on[id] ? `Hide ${name}` : `Show ${name}`} onClick={(e) => { e.stopPropagation(); toggleSec(id); }} className={cn("flex size-7 flex-none items-center justify-center rounded-[7px] border-0 bg-transparent text-ink-3 hover:bg-neutral-soft hover:text-foreground", id === "form" ? "cursor-default" : "cursor-pointer")}><TI className="size-4" /></button>
              </div>
            );
          })}
        </div>
      </aside>

      <main ref={setScrollEl} onClick={() => set({ sel: null })} className="relative min-h-0 overflow-auto px-6 pt-4 pb-20" style={{ background: "radial-gradient(#dcd5ce 1px, transparent 1.2px) 0 0 / 18px 18px, #efebe7" }}>
        <div className="mx-auto mb-3.5 flex max-w-280 flex-wrap items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <div className="flex rounded-[10px] border border-border bg-card p-0.75">{dev("desktop", "Desktop", MonitorIcon)}{dev("mobile", "Phone", SmartphoneIcon)}</div>
          <div className="flex h-8.5 min-w-0 items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-[13px]"><GlobeIcon className="size-4 text-success" /><span className="min-w-0 truncate font-mono text-xs">{url}</span></div>
          <span className="ml-auto hidden items-center gap-1.5 text-[12.5px] text-muted-foreground min-[1280px]:flex"><MousePointerClickIcon className="size-4" />{P.preview ? "Previewing as a respondent" : "Click a section to edit"}</span>
          <button type="button" onClick={() => set({ preview: !P.preview, sel: null, hover: null })} className={cn("flex h-8.5 cursor-pointer items-center gap-1.5 rounded-[10px] border px-3 text-[13px] font-bold", P.preview ? "border-foreground bg-foreground text-background" : "border-input bg-card text-foreground")}>{P.preview ? <PencilIcon className="size-4" /> : <EyeIcon className="size-4" />}{P.preview ? "Edit" : "Preview"}</button>
        </div>

        <div
          className="mx-auto w-full transition-[max-width] duration-250"
          style={{ maxWidth: mob ? 390 : 1120, height: mob ? "min(760px, calc(100vh - 150px))" : "auto", overflowY: mob ? "auto" : "hidden", overscrollBehavior: "contain", scrollbarWidth: "thin", borderRadius: mob ? 40 : 14, border: mob ? "10px solid #1b1724" : "1px solid #e6e1dc", background: "#f7f5f2", boxShadow: "0 30px 60px -40px rgba(27,23,36,.45)" }}
        >
          {!mob && (
            <div className="relative z-20 flex h-[38px] items-center gap-3 rounded-t-[14px] border-b border-neutral-soft bg-card px-3.5">
              <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className="size-2.5 rounded-full bg-border" />)}</div>
              <span className="mx-auto flex h-6 max-w-90 min-w-0 flex-1 items-center justify-center gap-1.5 overflow-hidden rounded-[7px] bg-neutral-soft/60 font-mono text-[11.5px] whitespace-nowrap text-ink-2"><LockIcon className="size-2.75" />{url}</span>
              <span className="w-10.5" />
            </div>
          )}
          <div className="relative grid" style={{ gridTemplateColumns: pg.cols, gridTemplateAreas: pg.areas, gridTemplateRows: pg.rows, background: "#f7f5f2", minHeight: pg.minH, fontFamily: "var(--font-manrope)" }}>
            <div style={{ gridRow: pg.bgRow, gridColumn: pg.bgCol, position: "relative", overflow: "hidden", background: col, borderRadius: 0, transition: "background .25s" }}>
              {P.tex !== "none" && <div className="pointer-events-none absolute inset-0" style={{ background: texFill(P.tex, col) }} />}
            </div>

            <div style={{ gridArea: "head", position: "relative", zIndex: 1, padding: pg.headPad, color: ink.head }}>
              {P.on.header && (
                <div {...sp("header", 6)} className="flex items-center gap-3" style={sp("header", 6).style}>
                  <span className="flex size-9 flex-none items-center justify-center overflow-hidden rounded-full bg-white text-ink-3" title="Logo upload needs file storage"><ImageIcon className="size-4" /></span>
                  <span className="min-w-0 flex-1 truncate text-[15px] tracking-[-0.01em]" style={HEAD}>{P.org.name}</span>
                  <span className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-bold whitespace-nowrap" style={{ borderColor: ink.headLine }}><LanguagesIcon className="size-4" />EN</span>
                </div>
              )}
            </div>

            <div style={{ gridArea: "hero", position: "relative", zIndex: 1, padding: pg.heroPad, color: ink.head }}>
              {P.on.hero && (
                <div {...sp("hero", 8)} className="flex flex-col gap-3.5" style={{ ...sp("hero", 8).style, maxWidth: pg.heroMax, margin: pg.heroM, textAlign: pg.align as CSSProperties["textAlign"], alignItems: pg.alignItems }}>
                  <span className="rounded-full px-2.5 py-1 text-xs font-extrabold tracking-[0.06em]" style={{ background: ink.chip }}>FORM · {year}</span>
                  <h1 className="m-0 leading-[1.08] tracking-tight text-balance" style={{ ...HEAD, fontSize: pg.h1 }}>{P.org.headline}</h1>
                  {P.org.intro && <p className="m-0 max-w-140 leading-[1.6] text-pretty" style={{ fontSize: pg.lead, color: ink.headMut }}>{P.org.intro}</p>}
                </div>
              )}
            </div>

            <div style={{ gridArea: "form", position: "relative", zIndex: 2, padding: pg.formPad }}>
              <div {...sp("form", 6, 20)} className="flex flex-col gap-5.5" style={{ ...sp("form", 6, 20).style, width: "100%", maxWidth: pg.formMax, margin: pg.formM, background: fc.bg, backdropFilter: fc.blur, WebkitBackdropFilter: fc.blur, border: `1px solid ${fc.bd}`, padding: pg.cardPad, boxShadow: fc.sh, color: fc.ink, transition: "background .2s, border-color .2s" }}>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[12.5px] font-bold" style={{ color: fc.mut }}><ClockIcon className="size-4" />About {mins} {mins === 1 ? "minute" : "minutes"}<span className="size-[3px] rounded-full" style={{ background: fc.mut }} />{S.fields.length} {S.fields.length === 1 ? "question" : "questions"}</div>
                  <h2 className="m-0 text-[22px] tracking-[-0.015em]" style={HEAD}>{S.title || "Untitled form"}</h2>
                </div>
                <div className="h-1 overflow-hidden rounded-[2px]" style={{ background: fc.track }}><div className="h-full rounded-[2px] transition-[width] duration-300" style={{ width: `${formProg}%`, background: accent }} /></div>
                {qs.map(field_)}
                {!qs.length && <span className="text-sm" style={{ color: fc.mut }}>Add questions in Build and they appear here.</span>}
                <div className="flex items-center gap-3">
                  <button type="button" className="flex h-12 cursor-default items-center gap-2 rounded-xl border-0 px-[22px] text-[15px] font-bold text-white shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]" style={{ background: accent }}>{S.design.btnText || "Submit"}<ArrowRightIcon className="size-4" /></button>
                </div>
              </div>
            </div>

            <div style={{ gridArea: "info", position: "relative", zIndex: 1, padding: pg.infoPad, color: ink.info }}>
              <div className="grid gap-3.5" style={{ maxWidth: pg.infoMax, margin: pg.infoM, gridTemplateColumns: pg.infoCols }}>
                {P.on.deadline && (
                  <div {...sp("deadline", 5, 16)} className="flex flex-wrap items-center gap-3" style={{ ...sp("deadline", 5, 16).style, gridColumn: "1 / -1", background: ic.bg, border: `1px solid ${ic.bd}`, padding: "14px 18px" }}>
                    <CalendarClockIcon className="size-[18px]" style={{ color: ic.icon }} />
                    <span className="text-[14.5px] font-bold">Closes {deadlineText}</span>
                    {daysLeft && <span className="rounded-full px-2.5 py-[3px] text-[12.5px] font-extrabold text-white" style={{ background: accent }}>{daysLeft}</span>}
                    {P.showCount && <span className="ml-auto flex items-center gap-1.5 text-[13.5px]" style={{ color: ic.mut }}><UsersIcon className="size-4" /><b className="tabular-nums" style={{ color: ink.info }}>{b.form.submissionCount ?? 0}</b>people have answered</span>}
                  </div>
                )}
                {P.on.about && infoCard("about", Building2Icon, "About us", P.org.about)}
                {P.on.why && infoCard("why", ShieldCheckIcon, "How your answers are used", P.org.why)}
                {P.on.faq && (
                  <div {...sp("faq", 5, 16)} className="flex flex-col" style={{ ...sp("faq", 5, 16).style, gridColumn: "1 / -1", background: ic.bg, border: `1px solid ${ic.bd}`, padding: "8px 22px 6px" }}>
                    <span className="pt-1.5 pb-2.5 text-base" style={HEAD}>Questions people ask</span>
                    {P.faq.map((q, i) => {
                      const open = P.faqOpen === i;
                      return (
                        <div key={i} className="border-t" style={{ borderColor: ic.line }}>
                          <button type="button" aria-expanded={open} onClick={(e) => { e.stopPropagation(); set({ faqOpen: open ? null : i }); }} className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent py-3.5 text-left text-[14.5px] font-bold" style={{ color: ink.info }}>{q.q}<ChevronDownIcon className="ml-auto size-4 transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none" }} /></button>
                          {open && <p className="mt-0 mb-3.5 animate-fl-rise text-sm leading-[1.6]" style={{ color: ic.mut }}>{q.a}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ gridArea: "foot", position: "relative", zIndex: 1, padding: pg.footPad, color: ink.foot }}>
              {P.on.footer && (
                <div {...sp("footer", 6, 4)} className="flex flex-wrap items-center gap-4 border-t pt-[18px] text-[13px]" style={{ ...sp("footer", 6, 4).style, maxWidth: pg.footMax, margin: "0 auto", borderColor: ink.footLine }}>
                  <span className="font-bold">© {year} {P.org.name}</span>
                  <span style={{ color: ink.footMut }}>Privacy</span>
                  <span style={{ color: ink.footMut }}>Contact us</span>
                  <span className="ml-auto flex items-center gap-1.5" style={{ color: ink.footMut }}><ShapesIcon className="size-4" />Made with Formlect</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <aside className="flex min-h-0 flex-col border-l border-neutral-soft bg-card">
        {!selId ? (
          <>
            <div className="flex h-11 flex-none items-center gap-2 border-b border-neutral-soft px-4 text-[13.5px] font-extrabold"><PaletteIcon className="size-4 text-primary" />Design</div>
            <div className="min-h-0 flex-1 overflow-auto">
              <Section>
                <button type="button" role="switch" aria-checked onClick={() => a.setLanding(false)} className="flex w-full cursor-pointer items-start gap-3 rounded-[14px] border-[1.5px] border-primary bg-tint p-3.5 text-left transition-all duration-150 hover:bg-accent">
                  <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-primary text-primary-foreground"><AppWindowIcon className="size-[17px]" /></span>
                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]"><span className="text-sm font-extrabold">This form is a page</span><span className="text-[12.5px] leading-[1.45] text-ink-2">Embeds on other sites still show only the form. Switch off to go back to a simple form.</span></span>
                  <span className="relative mt-0.5 h-5 w-[34px] flex-none rounded-full bg-primary"><span className="absolute top-[3px] left-[17px] size-3.5 rounded-full bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)]" /></span>
                </button>
              </Section>
              <Section className="gap-2.5">
                <span className={cap}>LAYOUT</span>
                <div className="grid grid-cols-2 gap-2">
                  {layDefs.map(([k, name, rects]) => (
                    <button key={k} type="button" aria-pressed={P.layout === k} onClick={() => set({ layout: k })} className={cn("flex cursor-pointer flex-col gap-1.5 rounded-xl border-[1.5px] p-1.5 text-left transition-all duration-150 hover:border-primary-300", P.layout === k ? "border-primary bg-tint-soft" : "border-border bg-card")}>
                      <div className="relative h-[62px] overflow-hidden rounded-[7px] bg-neutral-soft">{rects.map((r, i) => <span key={i} style={r} />)}</div>
                      <span className="flex items-center justify-between px-0.5 pb-0.5 text-[12.5px] font-extrabold">{name}<CheckIcon className="size-4 text-primary" style={{ opacity: P.layout === k ? 1 : 0 }} /></span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section>
                <span className={cap}>BACKGROUND</span>
                {seg([{ v: "color", label: "Color", icon: PaintBucketIcon }, { v: "image", label: "Image", icon: ImageIcon }, { v: "video", label: "Video", icon: ClapperboardIcon }], "color", () => {}, ["image", "video"])}
                <div className="flex flex-wrap gap-2 p-0.5">
                  {BGS.map((x) => (
                    <button key={x.c} type="button" title={x.name} aria-label={x.name} aria-pressed={P.bg === x.c} onClick={() => set({ bg: x.c })} className="flex size-[34px] cursor-pointer items-center justify-center rounded-[10px] border border-foreground/10 transition-transform duration-150 hover:scale-[1.06]" style={{ ...swatch(x.c, P.bg === x.c, "#4b2bd1"), color: x.ink }}><CheckIcon className="size-4" style={{ opacity: P.bg === x.c ? 1 : 0 }} /></button>
                  ))}
                </div>
                <div className="flex flex-col gap-2"><span className="text-[13px] font-bold">Texture</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TEXTURES.map(([k, label]) => (
                      <button key={k} type="button" aria-pressed={P.tex === k} onClick={() => set({ tex: k })} className={cn("flex cursor-pointer flex-col items-stretch gap-[3px] rounded-[10px] border-[1.5px] bg-card p-[3px] transition-colors duration-150 hover:border-primary-300", P.tex === k ? "border-primary" : "border-border")}>
                        <span className="h-[30px] rounded-[7px]" style={{ background: k === "none" ? P.bg : `${texFill(k, P.bg)}, ${P.bg}` }} />
                        <span className="text-[11px] font-extrabold text-sidebar-foreground">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {switchRow("Different color on phones", P.mobileBg, (v) => set({ mobileBg: v, device: v ? "mobile" : P.device }))}
                {P.mobileBg && (
                  <div className="flex animate-fl-rise flex-wrap gap-2 p-0.5">
                    {BGS.map((x) => (
                      <button key={x.c} type="button" title={x.name} aria-label={`${x.name} on phones`} aria-pressed={P.mbg === x.c} onClick={() => set({ mbg: x.c, device: "mobile" })} className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-foreground/10" style={{ ...swatch(x.c, P.mbg === x.c, "#4b2bd1"), color: x.ink }}><SmartphoneIcon className="size-3" style={{ opacity: P.mbg === x.c ? 1 : 0 }} /></button>
                    ))}
                  </div>
                )}
              </Section>
              <Section className="gap-2.5">
                <span className={cap}>BUTTON &amp; ACCENT</span>
                <div className="flex flex-wrap gap-2 p-0.5">
                  {PAGE_ACCENTS.map((c) => (
                    <button key={c} type="button" aria-label={c} aria-pressed={P.accent === c} onClick={() => set({ accent: c })} className="flex size-[30px] cursor-pointer items-center justify-center rounded-full border-0 text-white transition-transform duration-150 hover:scale-[1.08]" style={swatch(c, P.accent === c, c)}><CheckIcon className="size-[13px]" style={{ opacity: P.accent === c ? 1 : 0 }} /></button>
                  ))}
                </div>
              </Section>
              <Section className="gap-2.5">
                <span className={cap}>FORM CARD</span>
                {cardSeg}
                {glassNote && <span className="text-[12.5px] leading-normal text-muted-foreground">Frosted blurs the background behind the card. It shows when the card sits over the background: Hero, Full-bleed, or Cover on desktop.</span>}
              </Section>
              <div className="flex gap-2 p-4 text-[12.5px] leading-[1.55] text-muted-foreground"><MousePointerClickIcon className="mt-0.5 size-4 flex-none text-primary" />Click any part of the page to edit its content.</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-11 flex-none items-center gap-2 border-b border-neutral-soft px-2.5">
              <button type="button" aria-label="Back to page style" onClick={() => set({ sel: null })} className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-ink-2 hover:bg-secondary hover:text-foreground"><ArrowLeftIcon className="size-4" /></button>
              {(() => { const I = SEC_ICON[selId]; return <I className="size-4 text-primary" />; })()}
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-extrabold">{secName(selId)}</span>
              <button type="button" disabled={selId === "form"} title={selId === "form" ? "Always shown" : "Hide section"} aria-label={selId === "form" ? "Always shown" : "Hide section"} onClick={() => toggleSec(selId)} className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-default disabled:opacity-60">{selId === "form" ? <LockIcon className="size-4" /> : <EyeOffIcon className="size-4" />}</button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <Section className="gap-3.5">
                <span className={cap}>CONTENT</span>
                {selId === "header" && (<>{inp("Organization name", P.org.name, setOrg("name"))}<span className="text-[12.5px] leading-normal text-muted-foreground">Logo upload needs file storage, which isn’t available yet.</span></>)}
                {selId === "hero" && (<>{area("Headline", P.org.headline, setOrg("headline"), 2)}{area("Intro", P.org.intro, setOrg("intro"), 4)}</>)}
                {selId === "form" && (
                  <>
                    <span className="text-[13.5px] leading-normal text-ink-2">Questions, logic and field styles are edited in Build. This panel controls how the form card sits on the page.</span>
                    <button type="button" onClick={() => a.setLanding(false)} className="flex h-[34px] cursor-pointer items-center gap-1.5 self-start rounded-[9px] border-0 bg-accent px-3 text-[13px] font-bold text-accent-foreground hover:bg-accent-hover"><LayoutListIcon className="size-4" />Edit questions</button>
                    {cardSeg}
                  </>
                )}
                {selId === "about" && area("About text", P.org.about, setOrg("about"), 4)}
                {selId === "why" && area("How answers are used", P.org.why, setOrg("why"), 5)}
                {selId === "deadline" && (<>{inp("Closing date", P.org.deadline, setOrg("deadline"), "date")}{switchRow("Show response count", P.showCount, (v) => set({ showCount: v }))}</>)}
                {selId === "faq" && (
                  <>
                    {P.faq.map((q, i) => (
                      <div key={i} className="flex flex-col gap-1.5 rounded-[10px] border border-neutral-soft p-2.5">
                        <div className="flex gap-1.5">
                          <input value={q.q} aria-label="Question" placeholder="Question" onChange={(e) => set({ faq: P.faq.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)) })} className="h-[34px] min-w-0 flex-1 rounded-lg border border-input px-[9px] text-[13.5px] font-bold outline-none focus:border-primary" />
                          <button type="button" aria-label="Remove question" onClick={() => set({ faq: P.faq.filter((_, k) => k !== i), faqOpen: null })} className="flex size-[34px] cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-ink-3 hover:bg-destructive-soft hover:text-destructive"><Trash2Icon className="size-4" /></button>
                        </div>
                        <textarea value={q.a} rows={2} aria-label="Answer" placeholder="Answer" onChange={(e) => set({ faq: P.faq.map((x, k) => (k === i ? { ...x, a: e.target.value } : x)) })} className="resize-y rounded-lg border border-input px-[9px] py-[7px] text-[13px] leading-[1.45] outline-none focus:border-primary" />
                      </div>
                    ))}
                    <button type="button" onClick={() => set({ faq: [...P.faq, { q: "", a: "" }] })} className="flex h-8 cursor-pointer items-center gap-1.5 self-start rounded-lg border-0 bg-accent px-2.5 text-[13px] font-bold text-accent-foreground hover:bg-accent-hover"><PlusIcon className="size-4" />Add question</button>
                  </>
                )}
                {selId === "footer" && <span className="text-[13.5px] leading-normal text-ink-2">Footer shows your organization name, privacy and contact links.</span>}
              </Section>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
