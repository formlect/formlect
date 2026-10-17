import type { Builder } from "./use-builder";

export const slotAt = (b: Builder) => {
  const { S } = b;
  let at = S.dropAt;
  if (S.dragging) {
    const from = S.fields.findIndex((x) => x.id === S.dragging);
    if (at === from || at === from + 1) at = null;
  }
  return at;
};
