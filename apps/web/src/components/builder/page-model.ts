// Source: Formlect design planning / Form Page (embedded in Form Builder.dc.html). Page content is session-only for now.

export type SectionId = "header" | "hero" | "form" | "deadline" | "about" | "why" | "faq" | "footer";
export type PageLayout = "cover" | "split" | "hero" | "immersive";
export type PageDevice = "desktop" | "mobile";

export const BGS = [
  { c: "#1d5c45", ink: "#fff", name: "Forest" }, { c: "#4b2bd1", ink: "#fff", name: "Violet" }, { c: "#1b1724", ink: "#fff", name: "Ink" },
  { c: "#9a3412", ink: "#fff", name: "Clay" }, { c: "#efe3d0", ink: "#1b1724", name: "Sand" }, { c: "#dde7ee", ink: "#1b1724", name: "Mist" },
] as const;
export const PAGE_ACCENTS = ["#1d5c45", "#4b2bd1", "#c2410c", "#2236c9", "#1b1724"] as const;
export const TEXTURES = [["none", "None"], ["dots", "Dots"], ["grid", "Grid"], ["lines", "Lines"]] as const;
export type Texture = (typeof TEXTURES)[number][0];

export const SECTIONS: [SectionId, string][] = [
  ["header", "Header"], ["hero", "Hero"], ["form", "Form"], ["deadline", "Deadline & count"],
  ["about", "About"], ["why", "How we use data"], ["faq", "FAQ"], ["footer", "Footer"],
];
export const secName = (id: SectionId) => SECTIONS.find((s) => s[0] === id)![1];

export type PageState = {
  layout: PageLayout;
  device: PageDevice;
  preview: boolean;
  bg: string;
  tex: Texture;
  mobileBg: boolean;
  mbg: string;
  accent: string;
  card: "solid" | "glass";
  on: Record<SectionId, boolean>;
  org: { name: string; headline: string; intro: string; about: string; why: string; deadline: string };
  showCount: boolean;
  faq: { q: string; a: string }[];
  faqOpen: number | null;
  sel: SectionId | null;
  hover: SectionId | null;
  ans: Record<string, string | number | undefined>;
};

const inThirtyDays = () => new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

export const defaultPage = (title: string, desc: string): PageState => ({
  layout: "cover", device: "desktop", preview: false, bg: "#1d5c45", tex: "none", mobileBg: false, mbg: "#1b1724", accent: "#1d5c45", card: "solid",
  on: { header: true, hero: true, form: true, deadline: true, about: true, why: true, faq: true, footer: true },
  org: {
    name: "Your organization", headline: title || "Untitled form", intro: desc,
    about: "Tell people who is behind this form.", why: "Explain what happens to the answers people give and who can see them.", deadline: inThirtyDays(),
  },
  showCount: true,
  faq: [{ q: "Who can fill this in?", a: "Add who this form is for." }, { q: "How long does it take?", a: "Add how long people should expect to spend." }],
  faqOpen: 0, sel: null, hover: null, ans: {},
});

export function layoutCfg(L: PageLayout, mob: boolean) {
  const dim = L === "cover" || L === "immersive";
  if (mob)
    return {
      cols: "minmax(0,1fr)", areas: '"head" "hero" "form" "info" "foot"', rows: "auto auto auto auto auto", bgRow: L === "immersive" ? "1 / -1" : "1 / 3", bgCol: "1 / -1",
      headPad: "16px 18px", heroPad: L === "cover" ? "18px 20px 92px" : "16px 20px 32px", heroMax: "100%", heroM: "0",
      align: dim ? "center" : "left", alignItems: dim ? "center" : "flex-start",
      formPad: dim ? "0 12px" : "18px 12px 0", formM: L === "cover" ? "-68px 0 0" : "0", formMax: "100%",
      infoPad: "22px 12px 8px", infoMax: "100%", infoM: "0", infoCols: "minmax(0,1fr)", footPad: "18px 18px 26px", footMax: "100%",
      h1: "30px", lead: "15.5px", cardPad: "22px 18px", minH: "auto", infoOnBg: L === "immersive", footOnBg: L === "immersive", formOnBg: L === "immersive",
    };
  const base = { cols: "minmax(0,1fr)", areas: '"head" "hero" "form" "info" "foot"', rows: "auto auto auto auto auto", bgCol: "1 / -1", headPad: "22px 56px", heroMax: "720px", heroM: "0 auto", align: "center", alignItems: "center", formPad: "0 56px", formMax: "620px", infoMax: "620px", infoM: "0 auto", infoCols: "minmax(0,1fr)", footPad: "24px 56px 32px", footMax: "100%", lead: "17px", cardPad: "30px", minH: "760px", formM: "0 auto", bgRow: "1 / 3", heroPad: "", infoPad: "", h1: "48px", infoOnBg: false, footOnBg: false, formOnBg: true };
  if (L === "cover") return { ...base, heroPad: "40px 56px 128px", formM: "-90px auto 0", infoPad: "32px 56px 20px" };
  if (L === "immersive") return { ...base, bgRow: "1 / -1", heroPad: "40px 56px 36px", infoPad: "24px 56px 20px", infoOnBg: true, footOnBg: true };
  if (L === "split")
    return { ...base, cols: "minmax(0,5fr) minmax(0,6fr)", areas: '"head form" "hero form" "info form" "foot foot"', rows: "auto auto 1fr auto", bgRow: "1 / 4", bgCol: "1 / 2", headPad: "24px 40px", heroPad: "40px 40px 28px", heroMax: "100%", heroM: "0", align: "left", alignItems: "flex-start", formPad: "56px 44px", formMax: "520px", infoPad: "0 40px 40px", infoMax: "100%", infoM: "0", h1: "40px", footPad: "20px 44px 28px", infoOnBg: true, footOnBg: false, formOnBg: false };
  return { ...base, cols: "minmax(0,1.1fr) minmax(0,1fr)", areas: '"head head" "hero form" "info info" "foot foot"', heroPad: "52px 24px 64px 56px", heroMax: "560px", heroM: "0", align: "left", alignItems: "flex-start", formPad: "36px 56px 56px 24px", formM: "0 0 0 auto", formMax: "500px", infoPad: "40px 56px 20px", infoMax: "100%", infoM: "0", infoCols: "repeat(auto-fit, minmax(260px, 1fr))", h1: "44px" };
}

export function derive(S: PageState, mob: boolean, compact: boolean) {
  const pg = layoutCfg(S.layout, mob || compact);
  const col = mob && S.mobileBg ? S.mbg : S.bg;
  const B = BGS.find((b) => b.c === col) ?? BGS[0];
  const inkC = B.ink;
  const dark = inkC === "#fff";
  const headMut = dark ? "rgba(255,255,255,.84)" : "#4a4550";
  const headLine = dark ? "rgba(255,255,255,.35)" : "rgba(27,23,36,.18)";
  const accent = S.accent;
  const glass = S.card === "glass" && pg.formOnBg;
  const fc = glass
    ? dark
      ? { bg: "rgba(255,255,255,.12)", bd: "rgba(255,255,255,.28)", ink: "#fff", mut: "rgba(255,255,255,.8)", field: "rgba(255,255,255,.1)", fieldBd: "rgba(255,255,255,.34)", track: "rgba(255,255,255,.2)", blur: "blur(18px) saturate(1.2)", sh: "0 30px 60px -30px rgba(0,0,0,.45)" }
      : { bg: "rgba(255,255,255,.55)", bd: "rgba(255,255,255,.75)", ink: "#1b1724", mut: "#57525e", field: "rgba(255,255,255,.7)", fieldBd: "rgba(27,23,36,.14)", track: "rgba(27,23,36,.1)", blur: "blur(18px) saturate(1.2)", sh: "0 30px 60px -30px rgba(27,23,36,.3)" }
    : { bg: "#fff", bd: "#e8e3de", ink: "#1b1724", mut: "#6b6670", field: "#fff", fieldBd: "#ddd8d3", track: "#efebe7", blur: "none", sh: "0 30px 60px -32px rgba(27,23,36,.35)" };
  const ic = pg.infoOnBg
    ? { bg: dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.5)", bd: dark ? "rgba(255,255,255,.16)" : "rgba(27,23,36,.08)", mut: headMut, icon: inkC, line: headLine }
    : { bg: "#fff", bd: "#e8e3de", mut: "#57525e", icon: accent, line: "#efebe7" };
  const ink = { head: inkC, headMut, headLine, chip: dark ? "rgba(255,255,255,.14)" : "rgba(27,23,36,.07)", info: pg.infoOnBg ? inkC : "#1b1724", foot: pg.footOnBg ? inkC : "#1b1724", footMut: pg.footOnBg ? headMut : "#6b6670", footLine: pg.footOnBg ? headLine : "#e6e1dc" };
  return { pg, col, B, dark, fc, ic, ink, accent, glass };
}

// Texture overlay for a background colour (transparent base so it can sit on top of the fill).
export function texFill(t: Texture, c: string) {
  const lc = (BGS.find((b) => b.c === c) ?? BGS[0]).ink === "#fff" ? "255,255,255" : "27,23,36";
  return {
    none: "transparent",
    dots: `radial-gradient(rgba(${lc},.22) 1px, transparent 1.4px) 0 0 / 14px 14px`,
    grid: `linear-gradient(rgba(${lc},.12) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, rgba(${lc},.12) 1px, transparent 1px) 0 0 / 22px 22px`,
    lines: `repeating-linear-gradient(135deg, rgba(${lc},.1) 0 2px, transparent 2px 12px)`,
  }[t];
}
