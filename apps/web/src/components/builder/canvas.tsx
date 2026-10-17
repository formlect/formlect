"use client";

/* eslint-disable react-hooks/refs -- `b` carries event handlers that touch drag/save refs; none are read during render. */

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, EyeIcon, ListPlusIcon, PlusIcon } from "lucide-react";
import { cn } from "cn";
import type { Builder } from "./use-builder";
import { heading, mono, themeVars } from "./canvas-theme";
import { slotAt } from "./slot-at";
import { Shortcuts } from "./shortcuts";
import { Slot } from "./slot";
import { Block } from "./block";

export function Canvas({ b }: { b: Builder }) {
  const { S, th, edit, mobile, focusMode, cur, list, a: act } = b;
  const d = S.design;
  const total = list.length;
  const answered = list.filter((x) => S.answers[x.id] !== undefined && S.answers[x.id] !== "" && !(Array.isArray(S.answers[x.id]) && !(S.answers[x.id] as unknown[]).length)).length;
  const progress = focusMode ? (total ? (cur / total) * 100 : 0) : total ? (answered / total) * 100 : 0;
  const showProgress = S.tab !== "build" || S.mode === "preview";
  const blocks = focusMode ? list.slice(cur, cur + 1) : list;
  const at = slotAt(b);
  const errCount = Object.values(S.errors).filter(Boolean).length;
  const titleSize = mobile ? "24px" : "30px";
  const btnText = d.btnText || "Submit";
  const lastFocus = cur >= total - 1;

  return (
    <main
      ref={b.canvasRef}
      onClick={() => { if (edit && S.sel) b.set({ sel: null }); }}
      onDragOver={act.dragOver}
      onDrop={act.drop}
      className="min-h-0 overflow-auto px-6 pt-9 pb-[120px]"
      style={{ background: `radial-gradient(${th.dot} 1px, transparent 1.2px) 0 0 / 18px 18px, ${th.page}` }}
    >
      {S.tab === "build" && S.mode === "preview" && (
        <div className="mx-auto mb-4 flex max-w-[680px] animate-fl-rise items-center gap-2.5 rounded-xl bg-foreground px-3.5 py-2.5 text-[13px] text-background">
          <EyeIcon className="size-4 text-highlight" />
          <span className="flex-1">Preview. Fill it out like a respondent. Answers aren’t saved.</span>
          <button type="button" onClick={act.resetAnswers} className="cursor-pointer border-0 bg-transparent text-[13px] font-bold text-primary-300 hover:text-background">Reset</button>
        </div>
      )}

      <div
        ref={b.cardRef}
        className="relative mx-auto flex w-full flex-col gap-1.5 transition-[max-width] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
        style={{
          ...themeVars(th),
          maxWidth: mobile ? 390 : 720,
          height: mobile ? "min(780px, calc(100vh - 150px))" : "auto",
          overflowY: mobile ? "auto" : "visible",
          overscrollBehavior: "contain",
          scrollbarWidth: "thin",
          background: th.card,
          fontFamily: th.bf,
          color: th.ink,
          borderRadius: mobile ? 40 : th.cr,
          border: mobile ? "10px solid var(--foreground)" : `1px solid ${th.line}`,
          boxShadow: "0 1px 2px rgba(27,23,36,.04),0 24px 48px -28px rgba(27,23,36,.25)",
          padding: mobile ? "28px 6px 28px" : "44px 36px 40px",
        }}
      >
        {th.cover && (
          <div className="flex flex-none items-end px-4 py-3.5 transition-[background] duration-200" style={{ margin: mobile ? "-28px -6px 18px" : "-44px -36px 26px", height: mobile ? 110 : 150, background: th.coverBg, borderRadius: mobile ? "30px 30px 0 0" : `${th.cr} ${th.cr} 0 0` }}>
            {th.coverImg && <span className={cn(mono, "rounded-md bg-white px-2 py-[3px] text-[11px]")} style={{ color: th.mut }}>cover image</span>}
          </div>
        )}
        {showProgress && (
          <div className="mb-[18px] h-1 overflow-hidden rounded-full" style={{ background: th.line }}>
            <div className="h-full rounded-full transition-[width] duration-[350ms] ease-[cubic-bezier(.2,.8,.2,1)]" style={{ width: `${progress}%`, background: th.a }} />
          </div>
        )}

        {!edit && S.submitted ? (
          <div className="flex animate-fl-rise flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-16 animate-fl-pop items-center justify-center rounded-full text-[30px] text-white" style={{ background: th.a }}><CheckIcon className="size-8" /></div>
            <h2 className="m-0 text-2xl tracking-[-0.02em]" style={heading(th)}>Thanks for your response</h2>
            <p className="m-0 text-[15px]" style={{ color: th.mut }}>This is what respondents see after submitting.</p>
            <button type="button" onClick={act.resetAnswers} className="mt-2 h-10 cursor-pointer rounded-[10px] border px-4 text-sm font-bold hover:brightness-95" style={{ borderColor: th.line2, background: th.field }}>Submit another</button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 px-5 pb-[18px]">
              {edit ? (
                <>
                  <textarea value={S.title} onChange={(e) => act.setTitle(e.target.value)} rows={1} placeholder="Form title" aria-label="Form title" className="field-sizing-content w-full resize-none overflow-hidden border-0 bg-transparent p-0 leading-[1.2] tracking-[-0.025em] outline-none" style={{ ...heading(th), fontSize: titleSize, color: th.ink }} />
                  <textarea value={S.desc} onChange={(e) => act.setDesc(e.target.value)} rows={1} placeholder="Add a description (optional)" aria-label="Form description" className="field-sizing-content w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-[15px] leading-[1.55] outline-none" style={{ color: th.mut }} />
                </>
              ) : (
                <>
                  <h1 className="m-0 leading-[1.2] tracking-[-0.025em]" style={{ ...heading(th), fontSize: titleSize }}>{S.title}</h1>
                  <p className="m-0 text-[15px] leading-[1.55]" style={{ color: th.mut }}>{S.desc}</p>
                </>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {blocks.map((f, i) => (
                <Block key={f.id} b={b} f={f} i={focusMode ? cur : i} />
              ))}
              {at === S.fields.length && <Slot b={b} />}
            </div>

            {!S.fields.length && (
              <div className="mx-5 my-2 flex flex-col items-center gap-2 rounded-[14px] border-[1.5px] border-dashed p-9 text-center" style={{ borderColor: th.line2 }}>
                <span className="flex size-11 items-center justify-center text-xl" style={{ borderRadius: th.r, background: th.ring, color: th.a }}><ListPlusIcon className="size-5" /></span>
                <span className="text-[15px] font-extrabold">Add your first question</span>
                <span className="text-[13.5px]" style={{ color: th.mut }}>Pick a field on the right, drag one in, or press <b className={cn(mono, "font-medium")}>/</b></span>
              </div>
            )}

            {edit && (
              <button type="button" onClick={(e) => { e.stopPropagation(); b.set({ qi: true, qq: "", qx: 0 }); }} className="mx-5 mt-2.5 flex h-11 cursor-pointer items-center justify-center gap-2 border-[1.5px] border-dashed border-border-strong bg-transparent text-sm font-bold transition-all duration-150 hover:border-(--th-a) hover:bg-tint-soft hover:text-(--th-a)" style={{ borderRadius: th.r, color: th.mut }}>
                <PlusIcon className="size-4" />
                Add question
                <span className={cn(mono, "rounded-[5px] border border-b-2 px-1.5 text-[11px] text-ink-3")} style={{ borderColor: th.line2 }}>/</span>
              </button>
            )}

            {!focusMode && (
              <div className="flex items-center gap-3 px-5 pt-[22px]">
                <button type="button" onClick={act.submit} className="flex h-12 items-center gap-2 px-[22px] text-[15px] font-bold transition-[filter] duration-150 hover:brightness-95 active:translate-y-px" style={{ border: th.btnBd, borderRadius: th.r, background: th.btnBg, color: th.btnC, boxShadow: th.btnSh, cursor: edit ? "default" : "pointer" }}>
                  {btnText}
                  <ArrowRightIcon className="size-4" />
                </button>
                {!edit && errCount > 0 && <span className="text-[13.5px] font-bold text-destructive">{errCount === 1 ? "1 required question is empty" : `${errCount} required questions are empty`}</span>}
              </div>
            )}
            {focusMode && (
              <div className="flex flex-wrap items-center gap-2.5 px-5 pt-[22px]">
                {cur > 0 && (
                  <button type="button" aria-label="Previous question" onClick={() => b.set({ cur: Math.max(0, cur - 1) })} className="flex size-12 cursor-pointer items-center justify-center border" style={{ borderColor: th.line2, borderRadius: th.r, background: th.field, color: th.ink }}>
                    <ArrowLeftIcon className="size-4" />
                  </button>
                )}
                <button type="button" onClick={act.focusNext} className="flex h-12 cursor-pointer items-center gap-2 px-[22px] text-[15px] font-bold hover:brightness-95 active:translate-y-px" style={{ border: th.btnBd, borderRadius: th.r, background: th.btnBg, color: th.btnC, boxShadow: th.btnSh }}>
                  {lastFocus ? btnText : "OK"}
                  <CheckIcon className="size-4" />
                </button>
                <span className="text-[13px]" style={{ color: th.mut }}>press <b className={cn(mono, "font-medium")}>Enter ↵</b></span>
                <span className="ml-auto text-[13px] font-bold tabular-nums" style={{ color: th.mut }}>{total ? `${cur + 1} / ${total}` : ""}</span>
              </div>
            )}
          </>
        )}
      </div>
      <Shortcuts />
    </main>
  );
}
