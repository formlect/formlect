"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { isTyping } from "@/lib/is-typing";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFormsStore } from "@/stores/forms-store";
import { AppSidebar } from "./app-sidebar";
import { CommandPalette } from "./command-palette";
import { NewFormDialog } from "./new-form-dialog";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending, refetch } = authClient.useSession();
  const signedIn = !!session;

  useEffect(() => {
    if (!isPending && !session) router.replace("/sign-in");
  }, [isPending, session, router]);

  // Load forms once signed in; drop them (and any open dialog) on sign-out.
  useEffect(() => {
    if (signedIn) {
      void useFormsStore.getState().load();
    } else {
      useFormsStore.getState().reset();
      useDashboardStore.getState().reset();
    }
  }, [signedIn]);

  // ⌘K opens the palette anywhere; single-letter keys only fire when nothing is focused or open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { paletteOpen, newOpen, togglePalette, setNewOpen } = useDashboardStore.getState();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePalette();
      } else if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target) && !paletteOpen && !newOpen) {
        e.preventDefault();
        setNewOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!session) return null;

  return (
    <>
      <SidebarProvider>
        <AppSidebar user={session.user} />
        <SidebarInset className="min-w-0">
          <div className="flex h-12 items-center border-b border-border px-4 md:hidden">
            <SidebarTrigger />
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
      <CommandPalette />
      <NewFormDialog />
      {!session.user.isOnboarded && <OnboardingFlow user={session.user} onDone={() => void refetch()} />}
    </>
  );
}
