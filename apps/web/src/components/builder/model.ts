import {
  AlignLeftIcon,
  CalendarClockIcon,
  CalendarIcon,
  CameraIcon,
  ChevronDownIcon,
  CircleDotIcon,
  ClockIcon,
  HashIcon,
  ImageIcon,
  LinkIcon,
  MailIcon,
  MicIcon,
  PaperclipIcon,
  PhoneIcon,
  SlidersHorizontalIcon,
  SquareCheckIcon,
  StarIcon,
  TextCursorInputIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react";

// Source: Formlect design planning / Form Builder.dc.html (field catalogue, presets, fonts).

export type Group = "text" | "contact" | "choice" | "number" | "date" | "media";

export type TypeDef = {
  n: string;
  i: LucideIcon;
  g: Group;
  l: string;
  ph?: string;
  it?: string;
  pre?: string;
  opts?: boolean;
  media?: { icon: LucideIcon; text: string; btn: string; hint: string; stem: string; ext: string };
};

export const T = {
  short: { n: "Short answer", i: TextCursorInputIcon, g: "text", l: "Untitled question", ph: "Type your answer", it: "text" },
  long: { n: "Long answer", i: AlignLeftIcon, g: "text", l: "Tell us more", ph: "Type your answer" },
  email: { n: "Email", i: MailIcon, g: "contact", l: "What’s your email?", ph: "name@example.com", it: "email" },
  phone: { n: "Phone", i: PhoneIcon, g: "contact", l: "What’s your phone number?", ph: "712 345 678", it: "tel", pre: "+254" },
  url: { n: "URL", i: LinkIcon, g: "contact", l: "Website or profile link", ph: "example.org", it: "text", pre: "https://" },
  single: { n: "Single choice", i: CircleDotIcon, g: "choice", l: "Choose one", opts: true },
  multiple: { n: "Multiple choice", i: SquareCheckIcon, g: "choice", l: "Choose all that apply", opts: true },
  select: { n: "Select", i: ChevronDownIcon, g: "choice", l: "Select an option", opts: true },
  number: { n: "Number", i: HashIcon, g: "number", l: "How many?", ph: "0", it: "number" },
  range: { n: "Range", i: SlidersHorizontalIcon, g: "number", l: "On a scale of 0 to 10" },
  rating: { n: "Rating", i: StarIcon, g: "number", l: "How would you rate it?" },
  date: { n: "Date", i: CalendarIcon, g: "date", l: "Pick a date", it: "date" },
  time: { n: "Time", i: ClockIcon, g: "date", l: "Pick a time", it: "time" },
  datetime: { n: "Date-time", i: CalendarClockIcon, g: "date", l: "Pick a date and time", it: "datetime-local" },
  image: { n: "Image", i: ImageIcon, g: "media", l: "Upload a photo", media: { icon: CameraIcon, text: "Add a photo", btn: "Take or choose", hint: "JPG, PNG or HEIC · up to 10 MB", stem: "photo", ext: "jpg" } },
  audio: { n: "Audio", i: MicIcon, g: "media", l: "Record a voice note", media: { icon: MicIcon, text: "Tap to record", btn: "Record", hint: "Up to 5 minutes", stem: "voice-note", ext: "m4a" } },
  video: { n: "Video", i: VideoIcon, g: "media", l: "Upload a video", media: { icon: VideoIcon, text: "Add a video", btn: "Choose", hint: "MP4 or MOV · up to 100 MB", stem: "clip", ext: "mp4" } },
  file: { n: "File upload", i: PaperclipIcon, g: "media", l: "Upload a file", media: { icon: PaperclipIcon, text: "Drag a file here", btn: "Browse", hint: "Any file · up to 10 MB", stem: "document", ext: "pdf" } },
} as const satisfies Record<string, TypeDef>;

export type FieldType = keyof typeof T;
export const typeDef = (t: FieldType): TypeDef => T[t];
export const TYPE_KEYS = Object.keys(T) as FieldType[];

export const GROUPS: [Group, string][] = [
  ["text", "Text"],
  ["contact", "Contact"],
  ["choice", "Choice"],
  ["number", "Number & scale"],
  ["date", "Date & time"],
  ["media", "Media & files"],
];
export const groupName = (g: Group) => GROUPS.find((x) => x[0] === g)![1];

export type Look = "cards" | "list" | "pills";
export type Field = {
  id: string;
  type: FieldType;
  label: string;
  help: string;
  ph: string;
  required: boolean;
  options: string[] | null;
  look: Look;
  max: number | null;
  min: number | null;
  unit: string;
  minLabel: string;
  maxLabel: string;
  files: number;
  rstyle: "stars" | "numbers";
  key: string;
};

export function mk(type: FieldType, o: Partial<Field> = {}): Field {
  const t: TypeDef = T[type];
  return {
    id: crypto.randomUUID(),
    type,
    label: t.l,
    help: "",
    ph: t.ph ?? "",
    required: false,
    options: t.opts ? ["Option 1", "Option 2", "Option 3"] : null,
    look: "cards",
    max: type === "rating" ? 5 : type === "range" ? 10 : null,
    min: type === "range" ? 0 : null,
    unit: "",
    minLabel: type === "range" ? "Not at all" : "",
    maxLabel: type === "range" ? "Completely" : "",
    files: 1,
    rstyle: "stars",
    key: "",
    ...o,
  };
}

export type Cond = { q: string; op: string; v: string };
export type RuleAction = "show" | "hide" | "jump" | "require";
export type Rule = { id: string; on: boolean; join: "all" | "any"; conds: Cond[]; action: RuleAction; target: string };

export type Answer = string | number | number[] | string[] | undefined;
export type Answers = Record<string, Answer>;

// Presets and accents are a fixed allow-list: user choices never become free-form CSS (threat-model F-04).
export const PRESETS = {
  formlect: { name: "Formlect", a: "#4b2bd1", ah: "#4024bd", card: "#ffffff", field: "#ffffff", line: "#e5e0db", line2: "#ddd8d3", ink: "#1b1724", mut: "#57525e", empty: "#f1eeea", page: "#efebe7", dot: "#dcd5ce" },
  paper: { name: "Paper", a: "#2236c9", ah: "#1c2eb3", card: "#fffdf8", field: "#fffefb", line: "#e6e1d3", line2: "#ddd7c7", ink: "#161a2c", mut: "#4a4d5c", empty: "#f1ede2", page: "#f1ece0", dot: "#ddd5c2" },
  forest: { name: "Forest", a: "#1d5c45", ah: "#174c39", card: "#ffffff", field: "#ffffff", line: "#dfe4dd", line2: "#d3dad1", ink: "#14211b", mut: "#4b554f", empty: "#eef2ec", page: "#e4ebe5", dot: "#cdd8cf" },
  peach: { name: "Peach", a: "#c2410c", ah: "#a8380a", card: "#fffaf6", field: "#ffffff", line: "#f1dccd", line2: "#ebd2c0", ink: "#2a1a12", mut: "#6b5246", empty: "#fbeee5", page: "#ffe7d9", dot: "#f6cfb9" },
  night: { name: "Night", a: "#8a73f3", ah: "#7b62f0", card: "#1f1b25", field: "#16131c", line: "#38323f", line2: "#4d4655", ink: "#efecf0", mut: "#a69fa9", empty: "#2a2531", page: "#0f0d13", dot: "#24202b" },
  mono: { name: "Mono", a: "#1b1724", ah: "#33303a", card: "#ffffff", field: "#ffffff", line: "#e3e1e4", line2: "#d7d4d8", ink: "#1b1724", mut: "#5c5960", empty: "#f0eff1", page: "#e8e7e9", dot: "#d3d1d5" },
} as const;
export type PresetKey = keyof typeof PRESETS;

export const ACCENTS: (string | null)[] = [null, "#4b2bd1", "#2236c9", "#1d5c45", "#c2410c", "#b4235a", "#1b1724"];

// Font stacks reference the next/font variables loaded in app/builder/layout.tsx.
export const FONTS = {
  modern: { name: "Modern", desc: "Sora + Manrope", hf: "var(--font-sora)", bf: "var(--font-manrope)", hw: 600 },
  editorial: { name: "Editorial", desc: "DM Serif + Plex", hf: "var(--font-dm-serif), serif", bf: "var(--font-plex), sans-serif", hw: 400 },
  friendly: { name: "Friendly", desc: "Bricolage", hf: "var(--font-bricolage)", bf: "var(--font-bricolage)", hw: 700 },
  system: { name: "System", desc: "Device font", hf: "system-ui", bf: "system-ui", hw: 600 },
} as const;
export type FontKey = keyof typeof FONTS;

export type Radius = "sharp" | "soft" | "round";
export type Design = {
  preset: PresetKey;
  accent: string | null;
  font: FontKey;
  radius: Radius;
  layout: "classic" | "focus";
  cover: "none" | "color" | "image";
  btn: "filled" | "outline";
  btnText: string;
};
export const DEFAULT_DESIGN: Design = { preset: "formlect", accent: null, font: "modern", radius: "soft", layout: "classic", cover: "none", btn: "filled", btnText: "Submit" };

const RADII: Record<Radius, [string, string]> = { sharp: ["4px", "6px"], soft: ["11px", "20px"], round: ["22px", "28px"] };

export function theme(d: Design) {
  const p = PRESETS[d.preset];
  const a = d.accent ?? p.a;
  const F = FONTS[d.font];
  const [r, cr] = RADII[d.radius];
  const filled = d.btn === "filled";
  return {
    ...p,
    a,
    ah: d.accent ? `color-mix(in oklch, ${a} 85%, black)` : p.ah,
    tint: `color-mix(in oklch, ${a} 9%, ${p.card})`,
    ring: `color-mix(in oklch, ${a} 20%, ${p.card})`,
    hf: F.hf,
    bf: F.bf,
    hw: F.hw,
    r,
    cr,
    btnBg: filled ? a : "transparent",
    btnC: filled ? "#fff" : a,
    btnBd: filled ? "0" : `1.5px solid ${a}`,
    btnSh: filled ? "inset 0 -2px 0 rgba(0,0,0,.18)" : "none",
    cover: d.cover !== "none",
    coverImg: d.cover === "image",
    coverBg: d.cover === "color" ? a : `repeating-linear-gradient(135deg, ${p.line} 0 10px, ${p.empty} 10px 20px)`,
  };
}
export type Theme = ReturnType<typeof theme>;
