"use client";

import type { ReactNode } from "react";
import { cn } from "cn";

export const Section = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn("flex flex-col gap-3 border-b border-row-line p-4", className)}>{children}</div>;
