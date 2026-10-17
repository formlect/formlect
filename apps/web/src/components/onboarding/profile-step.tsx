"use client";

import { CircleAlert, Loader2Icon, PencilIcon } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Props = { name: string; onName: (v: string) => void; initialImage: string; onNext: () => void };

const isHttpsUrl = (s: string) => URL.canParse(s) && new URL(s).protocol === "https:";

// ponytail: avatar is an https image URL (prefilled from Google/GitHub); swap for an upload once a file API exists
export function ProfileStep({ name, onName, initialImage, onNext }: Props) {
  const [image, setImage] = useState(initialImage);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const imageUrl = image.trim();
  const imageInvalid = imageUrl !== "" && !isHttpsUrl(imageUrl);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || imageInvalid || busy) return;
    setBusy(true);
    setError("");
    const { error } = await authClient.updateUser({ name: name.trim(), image: imageUrl || null });
    setBusy(false);
    if (error) setError(error.message ?? "Could not save your profile. Try again.");
    else onNext();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          aria-label="Change profile photo"
          className="group relative rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/20"
        >
          <Avatar size="lg" className="size-24 text-3xl">
            {!imageInvalid && imageUrl && <AvatarImage src={imageUrl} alt="" />}
            <AvatarFallback>{(name.trim() || "?").charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full border border-border bg-card text-ink-2 shadow-pop transition-colors group-hover:text-primary">
            <PencilIcon className="size-4" />
          </span>
        </button>
        <span className="text-[12.5px] text-muted-foreground">{imageUrl && !imageInvalid ? "Looking good." : "Add a photo so people recognise you."}</span>
        {editing && (
          <div className="grid w-full gap-1.5">
            <Label htmlFor="onboarding-avatar">Photo link</Label>
            <Input
              id="onboarding-avatar"
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              maxLength={2048}
              placeholder="https://..."
              aria-invalid={imageInvalid}
              aria-describedby={imageInvalid ? "onboarding-avatar-error" : undefined}
              autoFocus
            />
            {imageInvalid && (
              <p id="onboarding-avatar-error" className="text-xs text-destructive">
                Use an https:// image link.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="onboarding-name">Full name</Label>
        <Input id="onboarding-name" value={name} onChange={(e) => onName(e.target.value)} maxLength={100} autoComplete="name" required className="h-11" />
      </div>
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription className="font-semibold text-foreground">{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!name.trim() || imageInvalid || busy}>
          {busy && <Loader2Icon className="animate-spin" />}
          Continue
        </Button>
      </div>
    </form>
  );
}
