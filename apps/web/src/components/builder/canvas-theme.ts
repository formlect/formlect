import type { CSSProperties } from "react";
import { type Theme } from "./model";

export const ERR = { bd: "#ea7a4f", ring: "#fde3d8" }; // respondent-side error colours from the design (same in every theme)
export const RWORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
export const mono = "font-mono";

export const themeVars = (th: Theme) =>
  ({
    "--th-a": th.a, "--th-card": th.card, "--th-field": th.field, "--th-line": th.line, "--th-line2": th.line2, "--th-ink": th.ink, "--th-mut": th.mut,
    "--th-empty": th.empty, "--th-tint": th.tint, "--th-ring": th.ring, "--th-r": th.r, "--th-ah": th.ah,
  }) as CSSProperties;
export const heading = (th: Theme): CSSProperties => ({ fontFamily: th.hf, fontWeight: th.hw });
