const TONES = ["bg-accent", "bg-highlight-soft", "bg-success-soft", "bg-secondary"];
// Stable per-form tint so a card keeps its colour across renders.
export const tone = (id: string) => TONES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
