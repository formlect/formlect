"use client";

import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { FormsSection } from "@/components/dashboard/forms-section";
import { PromptHero } from "@/components/dashboard/prompt-hero";
import { Stats } from "@/components/dashboard/stats";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const firstName = session?.user.name.split(" ")[0] || "there";

  return (
    <main className="flex min-w-0 flex-col gap-7 px-4 pt-7 pb-16 md:px-9">
      <DashboardHeader firstName={firstName} />
      <PromptHero />
      <Stats />
      <div className="flex flex-wrap items-start gap-7">
        <FormsSection />
        <ActivityPanel />
      </div>
    </main>
  );
}
