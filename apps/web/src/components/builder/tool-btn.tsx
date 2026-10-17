"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

export function ToolBtn({ title, onClick, children, className, active }: { title: string; onClick: (e: React.MouseEvent) => void; children: ReactNode; className?: string; active?: boolean }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} className={cn("flex h-7 w-[30px] cursor-pointer items-center justify-center rounded-[7px] text-background hover:bg-background/15", active && "bg-primary hover:bg-primary", className)}>
      {children}
    </button>
  );
}
