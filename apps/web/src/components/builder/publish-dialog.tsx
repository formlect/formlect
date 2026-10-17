"use client";

import { AsteriskIcon, CheckIcon, CircleAlertIcon, CircleCheckIcon, CopyIcon, EyeIcon, SendIcon, SmartphoneIcon } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Builder } from "./use-builder";

export function PublishDialog({ b }: { b: Builder }) {
  const { S, a } = b;
  const total = S.fields.length;
  const unlabeled = S.fields.filter((f) => !f.label.trim()).length;
  const reqCount = S.fields.filter((f) => f.required).length;
  const mins = Math.max(1, Math.round(total * 0.4));
  const checks = [
    { Icon: unlabeled ? CircleAlertIcon : CircleCheckIcon, c: unlabeled ? "text-destructive" : "text-success", text: unlabeled ? `${unlabeled} question without a label` : "Every question has a label" },
    { Icon: AsteriskIcon, c: "text-primary", text: `${reqCount} required ${reqCount === 1 ? "question" : "questions"}` },
    { Icon: SmartphoneIcon, c: "text-primary", text: "Works on phones and desktop" },
  ];
  return (
    <Dialog open={S.publish} onOpenChange={(open) => b.set({ publish: open })}>
      <DialogContent className="gap-4 sm:max-w-[460px]" showCloseButton={false}>
        {!S.live ? (
          <>
            <DialogHeader className="gap-1.5">
              <DialogTitle className="text-xl tracking-[-0.02em]">Publish this form?</DialogTitle>
              <DialogDescription>{total} {total === 1 ? "question" : "questions"} · about {mins} min to fill out. You can keep editing after publishing.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 rounded-xl bg-background px-3.5 py-3">
              {checks.map(({ Icon, c, text }) => (
                <div key={text} className="flex items-center gap-2.5 text-[13.5px] font-semibold"><Icon className={cn("size-4", c)} />{text}</div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => b.set({ publish: false })}>Keep editing</Button>
              <Button onClick={a.doPublish}><SendIcon />Publish</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 flex-none animate-fl-pop items-center justify-center rounded-full bg-success text-white"><CheckIcon className="size-[22px]" /></div>
              <div className="flex flex-col gap-0.5">
                <DialogTitle className="text-xl tracking-[-0.02em]">Your form is live</DialogTitle>
                <span className="text-[13.5px] text-ink-2">Share the link to start collecting responses.</span>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex h-[42px] min-w-0 flex-1 items-center overflow-hidden rounded-[10px] border border-input px-3 font-mono text-[12.5px] text-ellipsis whitespace-nowrap text-sidebar-foreground">{b.link.replace(/^https?:\/\//, "")}</div>
              <Button className="h-[42px] rounded-[10px] px-3.5" onClick={a.copyLink}>{S.copied ? <CheckIcon /> : <CopyIcon />}{S.copied ? "Copied" : "Copy link"}</Button>
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => { b.set({ publish: false, mode: "preview", tab: "build", sel: null }); a.resetAnswers(); }}><EyeIcon />Try it as a respondent</Button>
              <Button variant="secondary" onClick={() => b.set({ publish: false })}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
