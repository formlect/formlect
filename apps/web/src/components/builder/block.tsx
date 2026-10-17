"use client";

import { ArrowDownIcon, ArrowRightIcon, ArrowUpIcon, AsteriskIcon, CheckIcon, ChevronsUpDownIcon, CircleAlertIcon, CircleCheckIcon, CopyIcon, GitBranchIcon, GripVerticalIcon, MailIcon, PlusIcon, Trash2Icon, XIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "cn";
import { slug } from "./logic";
import { type Field, typeDef } from "./model";
import type { Builder } from "./use-builder";
import { ERR, heading, mono, RWORDS } from "./canvas-theme";
import { slotAt } from "./slot-at";
import { Slot } from "./slot";
import { ToolBtn } from "./tool-btn";

export function Block({ b, f, i }: { b: Builder; f: Field; i: number }) {
  const { S, th, lg, edit, mobile, a: act } = b;
  const t = typeDef(f.type);
  const TypeIcon = t.i;
  const sel = edit && S.sel === f.id;
  const hov = edit && S.hover === f.id && !sel;
  const val = S.answers[f.id];
  const err = !edit && !!S.errors[f.id];
  const foc = !edit && S.focus === f.id;
  const required = f.required || lg.req.has(f.id);
  const isChoice = f.type === "single" || f.type === "multiple";
  const isSelect = f.type === "select";
  const editOpts = sel && (isChoice || isSelect);
  const look = isChoice ? f.look : "cards";
  const cards = look === "cards";
  const listLook = look === "list";
  const pills = look === "pills";
  const stop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
  const labelSize = mobile ? "17px" : "19px";
  const hasLogic = edit && S.rules.some((r) => r.target === f.id || r.conds.some((c) => c.q === f.id));
  const isInput = !!t.it;
  const labelStyle: CSSProperties = { ...heading(th), fontSize: labelSize, letterSpacing: "-0.015em", lineHeight: 1.4, color: th.ink };
  const inputRing = foc ? `0 0 0 3px ${th.ring}` : "none";
  const inputBd = foc ? th.a : err ? ERR.bd : th.line2;
  const ro = { readOnly: edit, tabIndex: edit ? -1 : 0, style: { pointerEvents: edit ? "none" : "auto" } } as const;

  const rmax = f.max ?? 5;
  const rh = S.rhover?.id === f.id ? S.rhover.n : 0;
  const rv = rh || (typeof val === "number" ? val : 0);
  const rmin = f.min ?? 0;
  const rmx = f.max ?? 10;
  const rval = typeof val === "number" ? val : Math.round((rmin + rmx) / 2);
  const pct = rmx > rmin ? ((rval - rmin) / (rmx - rmin)) * 100 : 0;
  const files = Array.isArray(val) ? (val as string[]) : [];
  const media = "media" in t ? t.media : undefined;
  const MediaIcon = media?.icon;

  return (
    <>
      {S.dropAt !== null && slotAt(b) === i && <Slot b={b} />}
      <div
        data-fid={f.id}
        draggable={S.armed === f.id}
        onDragStart={(e) => act.startFieldDrag(f.id, e)}
        onDragEnd={act.endDrag}
        onMouseDown={
          edit
            ? (e) => {
                if ((e.target as HTMLElement).closest("textarea,input,select,button")) {
                  if (S.armed) b.set({ armed: null });
                  return;
                }
                if (S.armed !== f.id) b.set({ armed: f.id });
              }
            : undefined
        }
        onClick={edit ? (e) => { e.stopPropagation(); if (S.sel !== f.id) b.set({ sel: f.id, panel: "settings" }); } : undefined}
        onMouseEnter={edit ? () => b.set({ hover: f.id }) : undefined}
        onMouseLeave={edit ? () => b.set({ hover: null }) : undefined}
        className={cn("relative flex flex-col gap-3 rounded-[14px] border-[1.5px] px-5 py-[18px] transition-[border-color,box-shadow,background,opacity] duration-150", !edit ? "cursor-default" : S.dragging === f.id ? "cursor-grabbing" : "cursor-grab", S.justAdded === f.id ? "animate-fl-in" : err && "animate-fl-shake")}
        style={{
          borderColor: sel ? th.a : err ? ERR.bd : hov ? th.ring : "transparent",
          background: sel || hov ? th.card : "transparent",
          boxShadow: sel ? `0 0 0 4px ${th.ring}, 0 16px 32px -22px rgba(27,23,36,.35)` : err ? `0 0 0 4px ${ERR.ring}` : "none",
          opacity: S.dragging === f.id ? 0.35 : 1,
        }}
      >
        {edit && (sel || hov) && !mobile && (
          <button type="button" onMouseDown={(e) => { e.stopPropagation(); b.set({ armed: f.id, sel: f.id, panel: "settings" }); }} aria-label="Drag to reorder" title="Drag to reorder" className="absolute top-4 -left-9 flex h-8 w-7 animate-fl-fade cursor-grab items-center justify-center rounded-lg text-ink-3 hover:bg-secondary hover:text-foreground">
            <GripVerticalIcon className="size-4" />
          </button>
        )}

        {sel && (
          <>
            <div className="absolute -top-[17px] right-3.5 z-[2] flex animate-fl-rise gap-px rounded-[10px] bg-foreground p-[3px] shadow-[0_8px_20px_-8px_rgb(27_23_36/0.5)]">
              <ToolBtn title="Move up (⌥↑)" onClick={stop(() => act.move(f.id, -1))}><ArrowUpIcon className="size-4" /></ToolBtn>
              <ToolBtn title="Move down (⌥↓)" onClick={stop(() => act.move(f.id, 1))}><ArrowDownIcon className="size-4" /></ToolBtn>
              <ToolBtn title="Duplicate (⌘D)" onClick={stop(() => act.dup(f.id))}><CopyIcon className="size-4" /></ToolBtn>
              <ToolBtn title="Required" active={f.required} onClick={stop(() => act.upd(f.id, { required: !f.required }))}><AsteriskIcon className="size-4" /></ToolBtn>
              <ToolBtn title="Delete (⌫)" className="text-highlight" onClick={stop(() => act.del(f.id))}><Trash2Icon className="size-4" /></ToolBtn>
            </div>
            <div className="-mb-1 flex items-center gap-2">
              <span className="flex items-center gap-[5px] rounded-md px-[7px] py-0.5 text-[11.5px] font-extrabold" style={{ color: th.ah, background: th.ring }}>
                <TypeIcon className="size-3.5" />
                {t.n}
              </span>
              <span className={cn(mono, "text-[11px] text-ink-3")}>{f.key || slug(f.label)}</span>
            </div>
          </>
        )}

        <div className="flex items-start gap-2.5">
          <span className={cn(mono, "mt-1 flex flex-none items-center gap-[3px] text-[12.5px]")} style={{ color: th.a }}>
            {i + 1}
            <ArrowRightIcon className="size-[11px]" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {edit ? (
              <div className="flex items-start gap-1">
                <textarea value={f.label} onChange={(e) => act.upd(f.id, { label: e.target.value }, "l" + f.id)} rows={1} placeholder="Type your question" aria-label="Question" className="field-sizing-content min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 outline-none" style={labelStyle} />
                {required && <span style={{ ...labelStyle, color: th.a }}>*</span>}
              </div>
            ) : (
              <span style={{ ...labelStyle, textWrap: "pretty" }}>
                {f.label}
                {required && <span style={{ color: th.a }}> *</span>}
              </span>
            )}
            {edit && (sel || !!f.help) && (
              <textarea value={f.help} onChange={(e) => act.upd(f.id, { help: e.target.value }, "h" + f.id)} rows={1} placeholder="Add help text (optional)" aria-label="Help text" className="field-sizing-content w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-sm leading-normal outline-none" style={{ color: th.mut }} />
            )}
            {!edit && !!f.help && <span className="text-sm leading-normal" style={{ color: th.mut }}>{f.help}</span>}
          </div>
          {hasLogic && (
            <button type="button" onClick={(e) => { e.stopPropagation(); b.set({ tab: "logic", lgFilter: f.id, sel: null }); }} title="Open this question’s logic" className="mt-0.5 flex h-6 flex-none cursor-pointer items-center gap-[5px] rounded-[7px] bg-highlight-soft px-2 text-[11.5px] font-extrabold text-highlight-foreground hover:bg-highlight/50">
              <GitBranchIcon className="size-3.5" />
              Logic
            </button>
          )}
        </div>

        {isInput && (
          <div className="flex h-12 items-center overflow-hidden border transition-[border-color,box-shadow] duration-150" style={{ borderColor: inputBd, boxShadow: inputRing, borderRadius: th.r, background: th.field }}>
            {t.pre && <span className="flex items-center gap-1.5 pl-3.5 text-[14.5px] font-bold whitespace-nowrap" style={{ color: th.mut }}>{t.pre}</span>}
            {f.type === "email" && <MailIcon className="ml-3.5 size-4 text-ink-3" />}
            <input
              type={t.it}
              value={typeof val === "string" ? val : ""}
              onChange={edit ? undefined : (e) => act.ans(f.id, e.target.value)}
              onFocus={edit ? undefined : () => b.set({ focus: f.id })}
              onBlur={() => b.set({ focus: null })}
              placeholder={f.ph}
              aria-label={f.label}
              {...ro}
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[15px] outline-none"
              style={{ ...ro.style, color: th.ink }}
            />
            {f.type === "number" && f.unit && <span className="flex h-full items-center border-l bg-background px-3.5 text-[13.5px] font-bold" style={{ borderColor: th.line, color: th.mut }}>{f.unit}</span>}
          </div>
        )}

        {f.type === "long" && (
          <textarea
            value={typeof val === "string" ? val : ""}
            onChange={edit ? undefined : (e) => act.ans(f.id, e.target.value)}
            onFocus={edit ? undefined : () => b.set({ focus: f.id })}
            onBlur={() => b.set({ focus: null })}
            placeholder={f.ph}
            aria-label={f.label}
            rows={3}
            {...ro}
            className="resize-y border px-3.5 py-3 text-[15px] leading-normal outline-none transition-[border-color,box-shadow] duration-150"
            style={{ ...ro.style, borderColor: inputBd, boxShadow: inputRing, borderRadius: th.r, background: th.field, color: th.ink }}
          />
        )}

        {isChoice && !editOpts && (
          <div className={cn("flex flex-wrap", pills ? "flex-row" : "flex-col")} style={{ gap: listLook ? "2px" : "8px" }}>
            {(f.options ?? []).map((label, j) => {
              const on = f.type === "multiple" ? Array.isArray(val) && (val as number[]).includes(j) : val === j;
              return (
                <div
                  key={j}
                  role={f.type === "multiple" ? "checkbox" : "radio"}
                  aria-checked={on}
                  tabIndex={edit ? -1 : 0}
                  onKeyDown={edit ? undefined : (e) => { if (e.key === " ") { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                  onClick={edit ? undefined : (e) => {
                    e.stopPropagation();
                    if (f.type === "multiple") {
                      const c = Array.isArray(val) ? (val as number[]) : [];
                      act.ans(f.id, c.includes(j) ? c.filter((x) => x !== j) : [...c, j]);
                    } else act.ans(f.id, j);
                  }}
                  className={cn("flex items-center gap-2.5 border-[1.5px] text-[15px] font-semibold transition-all duration-150 active:scale-[0.99]", edit ? "cursor-[inherit]" : "cursor-pointer")}
                  style={{
                    minHeight: pills ? 0 : cards ? 48 : 40,
                    padding: pills ? "9px 16px" : cards ? "0 14px" : "0 8px",
                    borderRadius: pills ? 999 : cards ? th.r : 9,
                    borderColor: cards || pills ? (on ? th.a : th.line) : "transparent",
                    background: on ? (pills ? th.a : th.tint) : th.field,
                    color: on && pills ? "#fff" : th.ink,
                  }}
                >
                  {cards && (
                    <span className={cn(mono, "flex h-[22px] min-w-[22px] flex-none items-center justify-center rounded-md border text-[11px] transition-all duration-150", on ? "text-white" : "border-border-strong text-ink-3")} style={{ borderColor: on ? th.a : undefined, background: on ? th.a : th.field }}>
                      {String.fromCharCode(65 + j)}
                    </span>
                  )}
                  {listLook && (
                    <span className="flex size-[18px] flex-none items-center justify-center border-[1.5px] text-[11px] text-white transition-all duration-150" style={{ borderRadius: f.type === "multiple" ? 5 : "50%", borderColor: on ? th.a : "var(--control)", background: on ? th.a : th.field }}>
                      <CheckIcon className="size-3" style={{ opacity: on ? 1 : 0 }} />
                    </span>
                  )}
                  <span className="flex-1">{label}</span>
                  {cards && <CheckIcon className="size-[17px] transition-all duration-200" style={{ color: th.a, opacity: on ? 1 : 0, transform: `scale(${on ? 1 : 0.5})` }} />}
                </div>
              );
            })}
          </div>
        )}

        {isSelect && !editOpts && (
          <div className="relative">
            <select
              value={typeof val === "number" ? String(val) : ""}
              onChange={edit ? undefined : (e) => act.ans(f.id, e.target.value === "" ? undefined : +e.target.value)}
              disabled={edit}
              aria-label={f.label}
              className={cn("h-12 w-full cursor-pointer appearance-none border py-0 pr-10 pl-3.5 text-[15px] font-semibold opacity-100 outline-none", val === undefined && "text-ink-3")}
              style={{ borderColor: th.line2, borderRadius: th.r, background: th.field, color: val === undefined ? undefined : th.ink }}
            >
              <option value="">Select an option</option>
              {(f.options ?? []).map((label, j) => (
                <option key={j} value={j}>{label}</option>
              ))}
            </select>
            <ChevronsUpDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-3" />
          </div>
        )}

        {editOpts && (
          <div className="flex flex-col gap-1.5">
            {(f.options ?? []).map((v, j) => (
              <div key={j} className="flex h-11 animate-fl-rise items-center gap-2.5 border-[1.5px] bg-(--th-field) py-0 pr-1.5 pl-3 hover:border-border-strong" style={{ borderColor: th.line, borderRadius: th.r }}>
                <span className="size-[18px] flex-none border-[1.5px] border-control" style={{ borderRadius: f.type === "multiple" ? 5 : f.type === "select" ? 4 : "50%" }} />
                <input
                  data-opt={`c-${f.id}-${j}`}
                  value={v}
                  aria-label={`Option ${j + 1}`}
                  onChange={(e) => act.upd(f.id, { options: f.options!.map((x, k) => (k === j ? e.target.value : x)) }, "o" + f.id + j)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); act.addOpt(f.id, j + 1, "c"); }
                    if (e.key === "Backspace" && !v && f.options!.length > 1) { e.preventDefault(); act.upd(f.id, { options: f.options!.filter((_, k) => k !== j) }); }
                  }}
                  placeholder="Option"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold outline-none"
                  style={{ color: th.ink }}
                />
                {f.options!.length > 1 && (
                  <button type="button" aria-label="Remove option" onClick={stop(() => act.upd(f.id, { options: f.options!.filter((_, k) => k !== j) }))} className="flex size-[30px] cursor-pointer items-center justify-center rounded-lg text-ink-3 hover:bg-secondary hover:text-foreground">
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={stop(() => act.addOpt(f.id, undefined, "c"))} className="flex h-10 cursor-pointer items-center gap-2 border-[1.5px] border-dashed bg-transparent px-3 text-[13.5px] font-bold hover:border-primary-300 hover:text-(--th-a)" style={{ borderColor: th.line2, borderRadius: th.r, color: th.mut }}>
              <PlusIcon className="size-4" />
              Add option
              <span className="ml-auto text-xs font-semibold text-ink-3">or press Enter</span>
            </button>
          </div>
        )}

        {f.type === "rating" && f.rstyle !== "numbers" && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-0.5" onMouseLeave={() => b.set({ rhover: null })}>
              {Array.from({ length: rmax }, (_, j) => {
                const n = j + 1;
                const on = n <= rv;
                const preview = rh && n > (typeof val === "number" ? val : 0);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} of ${rmax}`}
                    tabIndex={edit ? -1 : 0}
                    onClick={edit ? undefined : (e) => { e.stopPropagation(); act.ans(f.id, n); }}
                    onMouseEnter={edit ? undefined : () => b.set({ rhover: { id: f.id, n } })}
                    className="flex size-11 items-center justify-center border-0 bg-transparent p-0 hover:bg-(--th-tint)"
                    style={{ borderRadius: th.r, cursor: edit ? "inherit" : "pointer", pointerEvents: edit ? "none" : "auto" }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" style={{ transform: `scale(${rh === n ? 1.12 : 1})`, transition: "transform .2s cubic-bezier(.2,1.6,.4,1),fill .12s", overflow: "visible" }}>
                      <path
                        d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"
                        fill={on ? (preview ? `color-mix(in oklch, ${th.a} 45%, ${th.card})` : th.a) : th.empty}
                        stroke={on ? (preview ? `color-mix(in oklch, ${th.a} 70%, ${th.card})` : th.a) : th.line2}
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
            <span className="text-[13.5px] font-extrabold" style={{ color: th.a }}>{RWORDS[Math.round((rv / rmax) * 5)] ?? ""}</span>
          </div>
        )}

        {f.type === "rating" && f.rstyle === "numbers" && (
          <div className="flex flex-col gap-1.5">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${rmax},minmax(0,1fr))` }}>
              {Array.from({ length: rmax }, (_, j) => {
                const n = j + 1;
                const on = val === n;
                return (
                  <button key={n} type="button" tabIndex={edit ? -1 : 0} onClick={edit ? undefined : (e) => { e.stopPropagation(); act.ans(f.id, n); }} className="h-[46px] rounded-[10px] border-[1.5px] text-[15px] font-extrabold transition-all duration-150 hover:border-primary-300" style={{ borderColor: on ? th.a : th.line, background: on ? th.a : th.field, color: on ? "#fff" : th.ink, cursor: edit ? "inherit" : "pointer", pointerEvents: edit ? "none" : "auto" }}>
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[12.5px] text-ink-3"><span>Poor</span><span>Excellent</span></div>
          </div>
        )}

        {f.type === "range" && (
          <div className="flex flex-col gap-2 pt-[30px]">
            <div className="relative">
              <span className="absolute -top-8 -translate-x-1/2 rounded-[7px] px-[9px] py-[3px] text-[12.5px] font-extrabold text-white tabular-nums" style={{ left: `calc(${pct}% + ${(0.5 - pct / 100) * 16}px)`, background: th.a }}>{rval}</span>
              <input type="range" min={rmin} max={rmx} value={rval} onChange={edit ? undefined : (e) => act.ans(f.id, +e.target.value)} disabled={edit} aria-label={f.label} className="w-full cursor-pointer" style={{ accentColor: th.a, pointerEvents: edit ? "none" : "auto" }} />
            </div>
            <div className="flex justify-between gap-3 text-[12.5px] text-ink-3">
              <span>{rmin} · {f.minLabel}</span>
              <span>{rmx} · {f.maxLabel}</span>
            </div>
          </div>
        )}

        {media && MediaIcon && (
          <div className="flex flex-col gap-1.5">
            <div
              onClick={edit ? undefined : (e) => { e.stopPropagation(); if (files.length < f.files) act.ans(f.id, [...files, `${media.stem}-${files.length + 1}.${media.ext}`]); }}
              className="flex min-h-12 flex-wrap items-center gap-1.5 border bg-(--th-field) py-1.5 pr-1.5 transition-colors duration-150 hover:border-primary-300"
              style={{ borderStyle: files.length ? "solid" : "dashed", borderColor: err ? ERR.bd : files.length ? th.ring : th.line2, borderRadius: th.r, paddingLeft: files.length ? 6 : 14, cursor: edit ? "inherit" : "pointer" }}
            >
              {files.map((name, j) => (
                <span key={j} className="flex h-[34px] animate-fl-rise items-center gap-2 rounded-lg bg-(--th-tint) px-1 text-[13px] font-bold">
                  <span className="flex size-[26px] items-center justify-center rounded-md" style={{ background: th.ring, color: th.a }}><MediaIcon className="size-[13px]" /></span>
                  {name}
                  <CircleCheckIcon className="size-4 text-success" />
                  <button type="button" aria-label="Remove" onClick={(e) => { e.stopPropagation(); act.ans(f.id, files.filter((_, k) => k !== j)); }} className="flex size-6 cursor-pointer items-center justify-center rounded-md text-ink-3 hover:bg-(--th-ring)">
                    <XIcon className="size-4" />
                  </button>
                </span>
              ))}
              {!files.length && (
                <>
                  <MediaIcon className="size-4 text-ink-3" />
                  <span className="flex-1 text-[15px] text-ink-3">{media.text}</span>
                </>
              )}
              {files.length < f.files && (
                <span className="ml-auto flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3 text-[13px] font-bold" style={{ color: th.ink }}>{files.length ? "Add another" : media.btn}</span>
              )}
            </div>
            <span className="text-[12.5px] text-ink-3">{media.hint + (f.files > 1 ? ` · ${f.files} files` : "")}</span>
          </div>
        )}

        {err && (
          <span className="-mt-1 flex animate-fl-rise items-center gap-1.5 text-[13px] font-bold text-destructive">
            <CircleAlertIcon className="size-4" />
            This question is required
          </span>
        )}
      </div>
    </>
  );
}
