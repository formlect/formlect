"use client";

import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export const AsideHead = ({ icon: Icon, title, right }: { icon: LucideIcon; title: string; right?: ReactNode }) => (
  <div className="flex h-11 flex-none items-center justify-between border-b border-neutral-soft px-4">
    <span className="flex items-center gap-2 text-[13.5px] font-extrabold"><Icon className="size-4 text-primary" />{title}</span>
    {right}
  </div>
);
