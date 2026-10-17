"use client";

import type { ReactNode } from "react";

export const Aside = ({ children }: { children: ReactNode }) => <aside className="flex min-h-0 flex-col border-l border-neutral-soft bg-card">{children}</aside>;
