"use client";

import { PlusIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useDashboardStore } from "@/stores/dashboard-store";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export function DashboardHeader({ firstName }: { firstName: string }) {
  const setNewOpen = useDashboardStore((s) => s.setNewOpen);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-muted-foreground" suppressHydrationWarning>
          {today}
        </span>
        <h1 className="font-heading text-[28px] font-semibold tracking-[-0.025em]" suppressHydrationWarning>
          {greeting()}, {firstName}
        </h1>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" disabled title="Coming soon">
          <UploadIcon />
          Import
        </Button>
        <Button onClick={() => setNewOpen(true)}>
          <PlusIcon />
          New form
          <Kbd className="border-0 bg-white/15 text-primary-foreground">N</Kbd>
        </Button>
      </div>
    </header>
  );
}
