"use client";

import { FilePlusIcon, FileTextIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { authClient } from "@/lib/auth-client";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFormsStore } from "@/stores/forms-store";

export function CommandPalette() {
  const router = useRouter();
  const forms = useFormsStore((s) => s.forms);
  const paletteOpen = useDashboardStore((s) => s.paletteOpen);
  const setPaletteOpen = useDashboardStore((s) => s.setPaletteOpen);
  const setNewOpen = useDashboardStore((s) => s.setNewOpen);
  const setQuery = useDashboardStore((s) => s.setQuery);
  const run = (fn: () => void) => () => {
    setPaletteOpen(false);
    fn();
  };

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen} title="Search" description="Search forms or run a command">
      <CommandInput placeholder="Search forms or type a command…" />
      <CommandList>
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={run(() => setNewOpen(true))}>
            <FilePlusIcon />
            Create new form
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={run(() => authClient.signOut({ fetchOptions: { onSuccess: () => router.replace("/sign-in") } }))}>
            <LogOutIcon />
            Sign out
          </CommandItem>
        </CommandGroup>
        {forms.length > 0 && (
          <CommandGroup heading="Forms">
            {/* There is no form screen yet, so picking a form filters the dashboard list to it. */}
            {forms.slice(0, 20).map((f) => (
              <CommandItem key={f.id} value={`${f.title} ${f.id}`} onSelect={run(() => setQuery(f.title))}>
                <FileTextIcon />
                <span className="truncate">{f.title}</span>
                <CommandShortcut>{f.isPublished ? `${f.submissionCount.toLocaleString()} responses` : "Draft"}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
