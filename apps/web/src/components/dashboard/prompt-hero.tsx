"use client";

import { BookOpenIcon, CalendarCheckIcon, FilePlusIcon, HandHeartIcon, HouseIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFormsStore } from "@/stores/forms-store";

const IDEAS = [
  { icon: BookOpenIcon, label: "Reading club survey" },
  { icon: HouseIcon, label: "Household survey" },
  { icon: CalendarCheckIcon, label: "Workshop RSVP" },
  { icon: HandHeartIcon, label: "Volunteer sign-up" },
];

// ponytail: no AI endpoint exists, so the prompt becomes the form's name. Swap submit() for a draft call when one does.
export function PromptHero() {
  const router = useRouter();
  const create = useFormsStore((s) => s.create);
  const setNewOpen = useDashboardStore((s) => s.setNewOpen);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const empty = !title.trim();

  async function submit() {
    if (empty || busy) return;
    setBusy(true);
    const form = await create(title.trim());
    if (form) {
      setTitle("");
      router.push(`/builder/${form.id}`);
    }
    setBusy(false);
  }

  return (
    <section className="flex flex-col items-center gap-[18px] rounded-[20px] border border-border bg-card px-7 pt-9 pb-7">
      <h2 className="text-center font-heading text-[clamp(22px,2.6vw,28px)] font-semibold tracking-[-0.025em] text-balance">What do you want to collect?</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex w-full max-w-180 flex-col gap-2 rounded-2xl border border-input bg-card p-3.5 pb-2.5 shadow-[0_12px_32px_-16px_rgb(27_23_36/0.14)] transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20"
      >
        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          maxLength={200}
          rows={2}
          aria-label="Form name"
          placeholder="Name your form. For example: a short survey for parents about the new reading club"
          className="min-h-13 resize-none rounded-none border-0 bg-transparent px-1 py-0.5 text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            <FilePlusIcon />
            Start blank
            <Kbd className="border-0 bg-transparent">N</Kbd>
          </Button>
          <div className="flex-1" />
          <Button type="submit" disabled={empty || busy}>
            {busy && <Loader2Icon className="animate-spin" />}
            Create form
            <Kbd className="border-0 bg-white/15 text-primary-foreground">↵</Kbd>
          </Button>
        </div>
      </form>

      <div className="flex flex-wrap justify-center gap-2">
        {IDEAS.map(({ icon: Icon, label }) => (
          <Button key={label} type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setTitle(label)}>
            <Icon className="text-primary" />
            {label}
          </Button>
        ))}
      </div>
    </section>
  );
}
