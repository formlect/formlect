"use client";

import { ArrowDownToLineIcon } from "lucide-react";
import type { Builder } from "./use-builder";

export function Slot({ b }: { b: Builder }) {
  return (
    <div className="pointer-events-none flex h-[58px] animate-fl-fade items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-(--th-a) bg-(--th-tint) text-[13.5px] font-extrabold text-(--th-a)">
      <ArrowDownToLineIcon className="size-4" />
      {b.S.dragLabel ?? "Drop here"}
    </div>
  );
}
