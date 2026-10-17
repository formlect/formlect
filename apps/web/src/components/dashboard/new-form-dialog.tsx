"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDashboardStore } from "@/stores/dashboard-store";
import { useFormsStore } from "@/stores/forms-store";

export function NewFormDialog() {
  const router = useRouter();
  const newOpen = useDashboardStore((s) => s.newOpen);
  const setNewOpen = useDashboardStore((s) => s.setNewOpen);
  const create = useFormsStore((s) => s.create);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    const form = await create(title.trim());
    if (form) {
      setTitle("");
      setNewOpen(false);
      router.push(`/builder/${form.id}`);
    }
    setBusy(false);
  }

  return (
    <Dialog open={newOpen} onOpenChange={setNewOpen}>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Create a form</DialogTitle>
            <DialogDescription>Give it a name. You can change everything later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="new-form-title">Form name</Label>
            <Input id="new-form-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Reading club survey" autoFocus />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim() || busy}>
              {busy && <Loader2Icon className="animate-spin" />}
              Create form
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
