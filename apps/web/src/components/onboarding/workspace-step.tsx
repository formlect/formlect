"use client";

import { CircleAlert, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeOnboarding } from "@/lib/onboarding";

type Props = { name: string; onName: (v: string) => void; onBack: () => void; onDone: () => void };

export function WorkspaceStep({ name, onName, onBack, onDone }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await completeOnboarding(name);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your workspace. Try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="onboarding-workspace">Workspace name</Label>
        <Input id="onboarding-workspace" value={name} onChange={(e) => onName(e.target.value)} maxLength={80} required autoFocus />
      </div>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription className="font-semibold text-foreground">{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" size="lg" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button type="submit" size="lg" disabled={!name.trim() || busy}>
          {busy && <Loader2Icon className="animate-spin" />}
          Finish
        </Button>
      </div>
    </form>
  );
}
