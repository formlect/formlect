"use client";

import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { BuilderShell } from "./builder-shell";
import { type LoadedForm, loadForm } from "./persist";

// Auth gate + fetch. The builder itself only mounts once the form is in hand, so its state can initialise from it.
export function BuilderLoader({ id }: { id: string }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [form, setForm] = useState<LoadedForm | null>(null);
  const [failed, setFailed] = useState(false);
  const signedIn = !!session;

  useEffect(() => {
    if (!isPending && !session) router.replace("/sign-in");
  }, [isPending, session, router]);

  useEffect(() => {
    if (!signedIn) return;
    let live = true;
    loadForm(id)
      .then((f) => live && setForm(f))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [id, signedIn]);

  if (failed)
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
          <CircleAlertIcon className="size-5" />
        </span>
        <span className="text-[15px] font-extrabold">We couldn’t open this form</span>
        <span className="text-[13.5px] text-muted-foreground">It may have been removed, or you may not have access.</span>
        <Button variant="outline" render={<Link href="/dashboard" />}>
          Back to dashboard
        </Button>
      </div>
    );

  if (!form)
    return (
      <div className="grid h-dvh grid-rows-[56px_1fr]">
        <Skeleton className="rounded-none" />
        <div className="flex justify-center p-9">
          <Skeleton className="h-96 w-full max-w-[720px] rounded-[20px]" />
        </div>
      </div>
    );

  return <BuilderShell form={form} />;
}
