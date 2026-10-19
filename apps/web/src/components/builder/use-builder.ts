"use client";

import { type DragEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { setPublished } from "@/lib/forms";
import { defCond, empty, evalLogic, opsFor, valKind } from "./logic";
import { type Answers, type Answer, DEFAULT_DESIGN, type Design, type Field, type FieldType, mk, type Rule, T, type Tab, theme, TYPE_KEYS, typeDef } from "./model";
import { defaultPage, type PageState } from "./page-model";
import { fieldsFromApi, type LoadedForm, saveForm } from "./persist";

export type Device = "desktop" | "mobile";
export type SaveState = "saved" | "saving" | "error";

type State = {
  title: string;
  desc: string;
  fields: Field[];
  rules: Rule[];
  design: Design;
  sel: string | null;
  hover: string | null;
  panel: "add" | "settings";
  mode: "edit" | "preview";
  device: Device;
  tab: Tab;
  lgFilter: string | null;
  cur: number;
  justRule: string | null;
  past: Field[][];
  future: Field[][];
  answers: Answers;
  errors: Record<string, boolean>;
  submitted: boolean;
  focus: string | null;
  rhover: { id: string; n: number } | null;
  pq: string;
  qi: boolean;
  qq: string;
  qx: number;
  armed: string | null;
  dropAt: number | null;
  dragging: string | null;
  dragLabel: string | null;
  justAdded: string | null;
  publish: boolean;
  live: boolean;
  copied: boolean;
  save: SaveState;
  landing: boolean;
  page: PageState;
};

const RESET_FILL = { answers: {}, errors: {}, submitted: false, cur: 0 } as const;

export function useBuilder(form: LoadedForm, initialTab: Tab) {
  const [S, setS] = useState<State>(() => ({
    title: form.title,
    desc: form.description ?? "",
    fields: fieldsFromApi(form.fields),
    rules: [],
    design: DEFAULT_DESIGN,
    sel: null, hover: null, panel: "add", mode: "edit", device: "desktop", tab: initialTab, lgFilter: null, justRule: null,
    past: [], future: [], ...RESET_FILL, focus: null, rhover: null,
    pq: "", qi: false, qq: "", qx: 0,
    armed: null, dropAt: null, dragging: null, dragLabel: null, justAdded: null,
    publish: false, live: form.isPublished, copied: false, save: "saved",
    landing: false, page: defaultPage(form.title, form.description ?? ""),
  }));
  const set = (p: Partial<State>) => setS((s) => ({ ...s, ...p }));

  // Elements live in state (the setters are the callback refs) so they can be read from handlers without ref access in render.
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null);
  const [cardEl, setCardEl] = useState<HTMLDivElement | null>(null);
  const drag = useRef<{ on: boolean; id: string | null; type: FieldType | null }>({ on: false, id: null, type: null });
  const hist = useRef<{ tag?: string; t: number }>({ t: 0 });
  const timers = useRef<{ added?: ReturnType<typeof setTimeout>; copied?: ReturnType<typeof setTimeout> }>({});

  // ---- autosave: title, description and the persistable subset of fields (see persist.ts) ----
  const [rev, setRev] = useState(0);
  const pending = useRef(false);
  const latest = useRef(S);
  const chain = useRef(Promise.resolve());
  useEffect(() => {
    latest.current = S;
  });
  const touch = () => {
    pending.current = true;
    setS((s) => ({ ...s, save: "saving" }));
    setRev((r) => r + 1);
  };
  const flush = () => {
    pending.current = false;
    chain.current = chain.current.then(async () => {
      const s = latest.current;
      try {
        await saveForm(form.id, { title: s.title, description: s.desc, fields: s.fields, settings: form.settings });
        if (!pending.current) setS((x) => ({ ...x, save: "saved" }));
      } catch {
        pending.current = true;
        setS((x) => ({ ...x, save: "error" }));
      }
    });
  };
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  });
  useEffect(() => {
    if (!rev) return;
    const t = setTimeout(() => flushRef.current(), 700);
    return () => clearTimeout(t);
  }, [rev]);
  useEffect(() => () => {
    if (pending.current) flushRef.current();
    clearTimeout(timers.current.added);
    clearTimeout(timers.current.copied);
  }, []);

  // ---- derived ----
  const edit = S.tab === "build" && S.mode === "edit";
  const mobile = S.device === "mobile";
  const th = theme(S.design);
  const lg = evalLogic(S.fields, S.rules, S.answers);
  const list = edit ? S.fields : S.fields.filter((f) => !lg.hidden.has(f.id));
  const focusMode = !edit && S.design.layout === "focus";
  const cur = Math.min(S.cur, Math.max(0, list.length - 1));
  const selected = S.fields.find((f) => f.id === S.sel);

  // ---- scrolling / geometry ----
  const scroller = () => (mobile && cardEl ? cardEl : canvasEl);
  const scrollTo = (id: string) => {
    const c = scroller();
    const el = c?.querySelector(`[data-fid="${id}"]`);
    if (!c || !el) return;
    const r = el.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    if (r.top < cr.top + 40 || r.bottom > cr.bottom - 40) c.scrollTo({ top: r.top - cr.top + c.scrollTop - 120, behavior: "smooth" });
  };
  const dropIndex = (y: number) => {
    const root = cardEl ?? canvasEl;
    if (!root) return S.fields.length;
    const els = [...root.querySelectorAll("[data-fid]")];
    for (let i = 0; i < els.length; i++) {
      const r = els[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return els.length;
  };

  // ---- field history ----
  const change = (fields: Field[], tag?: string) => {
    const now = Date.now();
    const push = !(tag && hist.current.tag === tag && now - hist.current.t < 1200);
    hist.current = { tag, t: now };
    setS((s) => ({ ...s, fields, past: push ? [...s.past, s.fields].slice(-60) : s.past, future: [] }));
    touch();
  };
  const upd = (id: string, patch: Partial<Field>, tag?: string) => change(S.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)), tag);
  // Read the latest state through the functional updater: the toast "Undo" button outlives the render that created it.
  const undo = () => {
    hist.current = { t: 0 };
    setS((s) => {
      const prev = s.past.at(-1);
      return prev ? { ...s, fields: prev, past: s.past.slice(0, -1), future: [s.fields, ...s.future], sel: prev.some((f) => f.id === s.sel) ? s.sel : null } : s;
    });
    touch();
  };
  const redo = () => {
    hist.current = { t: 0 };
    setS((s) => {
      const next = s.future[0];
      return next ? { ...s, fields: next, future: s.future.slice(1), past: [...s.past, s.fields], sel: next.some((f) => f.id === s.sel) ? s.sel : null } : s;
    });
    touch();
  };
  const setTitle = (title: string) => {
    set({ title });
    touch();
  };
  const setDesc = (desc: string) => {
    set({ desc });
    touch();
  };

  const flashAdded = (id: string) => {
    clearTimeout(timers.current.added);
    timers.current.added = setTimeout(() => set({ justAdded: null }), 700);
    setTimeout(() => scrollTo(id), 40);
    set({ justAdded: id });
  };
  const select = (id: string) => {
    set({ sel: id, panel: "settings" });
    setTimeout(() => scrollTo(id), 20);
  };
  const add = (type: FieldType, at?: number) => {
    const f = mk(type);
    const fs = [...S.fields];
    fs.splice(at ?? (S.sel ? fs.findIndex((x) => x.id === S.sel) + 1 : fs.length), 0, f);
    change(fs);
    set({ sel: f.id, panel: "settings", justAdded: f.id, qi: false, qq: "", mode: "edit", submitted: false, tab: "build" });
    flashAdded(f.id);
  };
  const dup = (id: string) => {
    const fs = [...S.fields];
    const i = fs.findIndex((f) => f.id === id);
    if (i < 0) return;
    const c: Field = { ...fs[i], id: crypto.randomUUID(), key: "", options: fs[i].options ? [...fs[i].options!] : null };
    fs.splice(i + 1, 0, c);
    change(fs);
    set({ sel: c.id });
    flashAdded(c.id);
    toast("Question duplicated");
  };
  const del = (id: string) => {
    const i = S.fields.findIndex((f) => f.id === id);
    if (i < 0) return;
    const next = S.fields.filter((f) => f.id !== id);
    change(next);
    set({ sel: (next[i] ?? next[i - 1])?.id ?? null });
    toast("Question deleted", { action: { label: "Undo", onClick: undo } });
  };
  const move = (id: string, d: number) => {
    const fs = [...S.fields];
    const i = fs.findIndex((f) => f.id === id);
    const j = i + d;
    if (i < 0 || j < 0 || j >= fs.length) return;
    [fs[i], fs[j]] = [fs[j], fs[i]];
    change(fs);
    setTimeout(() => scrollTo(id), 20);
  };
  const convert = (id: string, type: FieldType) => {
    const f = S.fields.find((x) => x.id === id)!;
    const d = mk(type);
    upd(id, { type, ph: d.ph, max: f.max ?? d.max, min: f.min ?? d.min, minLabel: f.minLabel || d.minLabel, maxLabel: f.maxLabel || d.maxLabel, options: typeDef(type).opts ? (f.options ?? d.options) : f.options });
    set({ answers: { ...S.answers, [id]: undefined } });
  };
  const addOpt = (id: string, at?: number, scope = "c") => {
    const f = S.fields.find((x) => x.id === id)!;
    const opts = [...(f.options ?? [])];
    const pos = at ?? opts.length;
    opts.splice(pos, 0, `Option ${opts.length + 1}`);
    upd(id, { options: opts });
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-opt="${scope}-${id}-${pos}"]`);
      el?.focus();
      el?.select();
    }, 40);
  };

  // ---- respondent side (preview) ----
  const ans = (id: string, v: Answer) => setS((s) => ({ ...s, answers: { ...s.answers, [id]: v }, errors: { ...s.errors, [id]: false } }));
  const resetAnswers = () => set({ ...RESET_FILL });
  const togglePreview = () => {
    setS((s) => ({ ...s, tab: "build", mode: s.tab !== "build" ? "preview" : s.mode === "edit" ? "preview" : "edit", sel: null, focus: null, ...RESET_FILL }));
    scroller()?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = () => {
    if (S.tab === "logic" || (S.tab === "build" && S.mode === "edit")) return;
    const errors: Record<string, boolean> = {};
    for (const f of S.fields) if (!lg.hidden.has(f.id) && (f.required || lg.req.has(f.id)) && empty(S.answers[f.id])) errors[f.id] = true;
    const first = S.fields.find((f) => errors[f.id]);
    if (first) {
      set({ errors, cur: Math.max(0, S.fields.filter((x) => !lg.hidden.has(x.id)).indexOf(first)) });
      setTimeout(() => scrollTo(first.id), 20);
      return;
    }
    set({ submitted: true });
    scroller()?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const focusNext = () => {
    const vis = S.fields.filter((x) => !lg.hidden.has(x.id));
    const c = Math.min(S.cur, vis.length - 1);
    const f = vis[c];
    if (f && (f.required || lg.req.has(f.id)) && empty(S.answers[f.id])) {
      set({ errors: { ...S.errors, [f.id]: true } });
      return;
    }
    if (c >= vis.length - 1) submit();
    else set({ cur: c + 1 });
  };

  // ---- drag and drop (native HTML5, as in the design) ----
  const endDrag = () => {
    drag.current = { on: false, id: null, type: null };
    set({ armed: null, dropAt: null, dragging: null, dragLabel: null });
  };
  const startFieldDrag = (id: string, e: DragEvent) => {
    drag.current = { on: true, id, type: null };
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", id);
    } catch {}
    setTimeout(() => set({ dragging: id, dragLabel: "Drop here" }), 0);
  };
  const startTypeDrag = (type: FieldType, e: DragEvent) => {
    drag.current = { on: true, id: null, type };
    e.dataTransfer.effectAllowed = "copy";
    try {
      e.dataTransfer.setData("text/plain", type);
    } catch {}
    set({ mode: "edit", dragLabel: `Drop to add ${T[type].n.toLowerCase()}` });
  };
  const dragOver = (e: DragEvent) => {
    if (!drag.current.on) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = drag.current.type ? "copy" : "move";
    const at = dropIndex(e.clientY);
    if (at !== S.dropAt) set({ dropAt: at });
    const c = scroller();
    if (c) {
      const r = c.getBoundingClientRect();
      if (e.clientY < r.top + 70) c.scrollTop -= 16;
      else if (e.clientY > r.bottom - 70) c.scrollTop += 16;
    }
  };
  const drop = (e: DragEvent) => {
    if (!drag.current.on) return;
    e.preventDefault();
    let at = S.dropAt ?? S.fields.length;
    const { type, id } = drag.current;
    if (type) {
      endDrag();
      add(type, at);
      return;
    }
    if (id) {
      const fs = [...S.fields];
      const from = fs.findIndex((f) => f.id === id);
      if (from >= 0 && at !== from && at !== from + 1) {
        const [m] = fs.splice(from, 1);
        if (from < at) at--;
        fs.splice(at, 0, m);
        change(fs);
        set({ sel: m.id });
      }
    }
    endDrag();
  };
  // Disarm when the mouse is released without a drag starting.
  useEffect(() => {
    const up = () => setS((s) => (s.armed && !drag.current.on ? { ...s, armed: null } : s));
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // ---- logic rules ----
  const updRule = (id: string, patch: Partial<Rule>) => setS((s) => ({ ...s, rules: s.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  const setCond = (rid: string, j: number, patch: Partial<{ q: string; op: string; v: string }> & { reset?: boolean }) => {
    const r = S.rules.find((x) => x.id === rid)!;
    const conds = r.conds.map((c, k) => {
      if (k !== j) return c;
      if (patch.reset) return defCond(S.fields, patch.q!);
      const p = { ...patch };
      delete p.reset;
      const n = { ...c, ...p };
      if (p.op && valKind(S.fields.find((x) => x.id === c.q), p.op) === "none") n.v = "";
      return n;
    });
    updRule(rid, { conds });
  };
  const addRule = () => {
    const src = S.lgFilter ?? (S.fields.find((f) => ["single", "multiple", "select", "rating"].includes(f.type)) ?? S.fields[0])?.id;
    if (!src) {
      toast("Add a question first");
      return;
    }
    const si = S.fields.findIndex((f) => f.id === src);
    const rule: Rule = { id: crypto.randomUUID(), on: true, join: "all", conds: [defCond(S.fields, src)], action: "show", target: (S.fields[si + 1] ?? S.fields[0]).id };
    set({ rules: [...S.rules, rule], justRule: rule.id });
    setTimeout(() => document.querySelector("main")?.scrollTo({ top: 1e5, behavior: "smooth" }), 40);
  };
  const dupRule = (id: string) => {
    const i = S.rules.findIndex((r) => r.id === id);
    const c: Rule = { ...S.rules[i], id: crypto.randomUUID(), conds: S.rules[i].conds.map((x) => ({ ...x })) };
    const rs = [...S.rules];
    rs.splice(i + 1, 0, c);
    set({ rules: rs, justRule: c.id });
  };
  const delRule = (id: string) => {
    set({ rules: S.rules.filter((r) => r.id !== id) });
    toast("Rule deleted");
  };
  const testLogic = () => set({ tab: "build", mode: "preview", sel: null, ...RESET_FILL });

  // ---- navigation / publish ----
  const setTab = (tab: Tab) => set({ tab, sel: null, mode: "edit", justRule: null, ...RESET_FILL });
  const setDesign = (p: Partial<Design>) => setS((s) => ({ ...s, design: { ...s.design, ...p } }));
  const setPage = (p: Partial<PageState>) => setS((s) => ({ ...s, page: { ...s.page, ...p } }));
  const setLanding = (on: boolean) => {
    set({ landing: on, sel: null });
    toast(on ? "Your form is now a page" : "Back to a simple form");
  };
  const doPublish = async () => {
    try {
      await setPublished(form.id, true);
      set({ live: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish the form.");
    }
  };
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/to/${form.slug}`;
  const copyLink = () => {
    navigator.clipboard?.writeText(link).catch(() => {});
    set({ copied: true });
    clearTimeout(timers.current.copied);
    timers.current.copied = setTimeout(() => set({ copied: false }), 1600);
  };

  // ---- keyboard (⌘P, ⌘Z, ⌘D, /, arrows, ⌫, ⌥↑↓, Enter in focus layout) ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;
      const k = e.key;
      if (S.qi || S.publish || (S.tab === "design" && S.landing)) return;
      if (k === "Enter" && !meta && !e.shiftKey && S.design.layout === "focus" && S.tab !== "logic" && !(S.tab === "build" && S.mode === "edit") && tg.tagName !== "TEXTAREA" && !S.submitted) {
        e.preventDefault();
        focusNext();
        return;
      }
      if (meta && k.toLowerCase() === "p") {
        e.preventDefault();
        togglePreview();
        return;
      }
      if (k === "Escape") {
        if (typing) tg.blur();
        else if (S.sel) set({ sel: null });
        return;
      }
      if (meta && k.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && k.toLowerCase() === "d" && S.sel && edit) {
        e.preventDefault();
        dup(S.sel);
        return;
      }
      if (typing || !edit || meta) return;
      if (k === "/") {
        e.preventDefault();
        set({ qi: true, qq: "", qx: 0 });
        return;
      }
      if (!S.sel) {
        if ((k === "ArrowDown" || k === "ArrowUp") && S.fields.length) {
          e.preventDefault();
          select(S.fields[k === "ArrowDown" ? 0 : S.fields.length - 1].id);
        }
        return;
      }
      const i = S.fields.findIndex((f) => f.id === S.sel);
      if (k === "Backspace" || k === "Delete") {
        e.preventDefault();
        del(S.sel);
      } else if (e.altKey && (k === "ArrowUp" || k === "ArrowDown")) {
        e.preventDefault();
        move(S.sel, k === "ArrowUp" ? -1 : 1);
      } else if (k === "ArrowUp" || k === "ArrowDown") {
        e.preventDefault();
        select(S.fields[Math.max(0, Math.min(S.fields.length - 1, i + (k === "ArrowUp" ? -1 : 1)))].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const qiList = () => {
    const q = S.qq.trim().toLowerCase();
    return TYPE_KEYS.filter((k) => !q || T[k].n.toLowerCase().includes(q) || T[k].g.includes(q));
  };

  return {
    S, set, th, lg, list, edit, mobile, focusMode, cur, selected, form,
    canvasRef: setCanvasEl, cardRef: setCardEl,
    a: { change, upd, undo, redo, select, add, dup, del, move, convert, addOpt, ans, resetAnswers, togglePreview, submit, focusNext, endDrag, startFieldDrag, startTypeDrag, dragOver, drop, updRule, setCond, addRule, dupRule, delRule, testLogic, setTab, setDesign, doPublish, copyLink, qiList, setTitle, setDesc, setPage, setLanding, newCond: (q: string) => defCond(S.fields, q) },
    link, opsFor,
  };
}

export type Builder = ReturnType<typeof useBuilder>;
