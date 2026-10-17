"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

export function Tile({ on, onClick, children, className }: { on: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className={cn("cursor-pointer border-[1.5px] transition-all duration-150 hover:border-primary-300", on ? "border-primary bg-tint text-accent-foreground" : "border-border bg-card text-sidebar-foreground", className)}>
      {children}
    </button>
  );
}
