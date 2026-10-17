import type { Answer, Answers, Cond, Field, Rule } from "./model";

// Pure rule engine, ported from the design file (opsFor / valKind / match / evalLogic / condText).

export const empty = (v: Answer) => v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length);

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .split("_")
    .slice(0, 4)
    .join("_") || "question";

export function opsFor(type: string): [string, string][] {
  if (type === "single" || type === "select") return [["is", "is"], ["isnot", "is not"]];
  if (type === "multiple") return [["has", "includes"], ["hasnot", "doesn’t include"]];
  if (["rating", "number", "range"].includes(type)) return [["eq", "is"], ["gte", "is at least"], ["lte", "is at most"]];
  return [["filled", "is answered"], ["empty", "is empty"], ["contains", "contains"]];
}

export type ValKind = "none" | "opt" | "num" | "text";
export function valKind(f: Field | undefined, op: string): ValKind {
  if (!f) return "none";
  if (["single", "select", "multiple"].includes(f.type)) return "opt";
  if (["rating", "number", "range"].includes(f.type)) return "num";
  return op === "contains" ? "text" : "none";
}

export function defCond(fields: Field[], q: string): Cond {
  const f = fields.find((x) => x.id === q);
  const op = opsFor(f ? f.type : "short")[0][0];
  const k = valKind(f, op);
  return { q, op, v: k === "opt" ? "0" : k === "num" ? String(f?.type === "rating" ? 3 : 1) : "" };
}

function match(c: Cond, ans: Answers) {
  const a = ans[c.q];
  const v = c.v;
  const has = a !== undefined && a !== "";
  switch (c.op) {
    case "is": return has && a === +v;
    case "isnot": return has && a !== +v;
    case "has": return Array.isArray(a) && (a as number[]).includes(+v);
    case "hasnot": return !(Array.isArray(a) && (a as number[]).includes(+v));
    case "eq": return has && +(a as number) === +v;
    case "gte": return has && +(a as number) >= +v;
    case "lte": return has && +(a as number) <= +v;
    case "filled": return !empty(a);
    case "empty": return empty(a);
    case "contains": return typeof a === "string" && !!v && a.toLowerCase().includes(v.toLowerCase());
  }
  return false;
}

export function evalLogic(fields: Field[], rules: Rule[], ans: Answers) {
  const hidden = new Set<string>();
  const req = new Set<string>();
  const shows: Record<string, boolean> = {};
  const ix = (id: string) => fields.findIndex((f) => f.id === id);
  for (const r of rules) {
    if (!r.on || !r.target || !r.conds.length) continue;
    const ms = r.conds.map((c) => match(c, ans));
    const m = r.join === "any" ? ms.some(Boolean) : ms.every(Boolean);
    if (r.action === "show") shows[r.target] = shows[r.target] || m;
    if (r.action === "hide" && m) hidden.add(r.target);
    if (r.action === "require" && m) req.add(r.target);
    if (r.action === "jump" && m) {
      const si = ix(r.conds[0].q);
      const ti = r.target === "__end" ? fields.length : ix(r.target);
      if (ti > si) for (let k = si + 1; k < ti; k++) hidden.add(fields[k].id);
    }
  }
  for (const id of Object.keys(shows)) if (!shows[id]) hidden.add(id);
  return { hidden, req };
}

export function condText(fields: Field[], f: Field | undefined, c: Cond) {
  if (!f) return "a deleted question";
  const n = `Q${fields.indexOf(f) + 1}`;
  const op = opsFor(f.type).find((o) => o[0] === c.op)?.[1] ?? "";
  const k = valKind(f, c.op);
  return n + " " + op + (k === "opt" ? ` “${f.options?.[+c.v] ?? ""}”` : k === "num" ? ` ${c.v}` : k === "text" ? ` “${c.v}”` : "");
}
