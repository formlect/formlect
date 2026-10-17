"use client";

import { useState } from "react";
import { Logo } from "@/components/auth/logo";
import { cn } from "@/lib/utils";
import { OnboardingPreview } from "./onboarding-preview";
import { ProfileStep } from "./profile-step";
import { WorkspaceStep } from "./workspace-step";

type Props = { user: { name: string; image?: string | null }; onDone: () => void };

const STEPS = [
  { title: "Tell us about you", description: "This is how collaborators and respondents will see you." },
  { title: "Name your workspace", description: "Your forms live here. We made one for you; give it a name." },
];

// Full-screen until both steps are done. It can't be dismissed: the server marks the user onboarded on the last step.
export function OnboardingFlow({ user, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.name);
  const [workspace, setWorkspace] = useState("Default workspace");
  const { title, description } = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 grid overflow-y-auto bg-background lg:grid-cols-2" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className="flex min-h-screen flex-col px-8 py-7">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <span key={s.title} className={cn("h-1.5 rounded-sm transition-all", i === step ? "w-5.5" : "w-1.5", i <= step ? "bg-primary" : "bg-input")} />
            ))}
            <span className="ml-1.5 text-[12.5px] font-bold text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="flex w-full max-w-110 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 id="onboarding-title" className="font-heading text-[28px] leading-[1.15] font-semibold tracking-[-0.025em]">
                {title}
              </h1>
              <p className="text-[15px] leading-relaxed text-ink-2">{description}</p>
            </div>
            {step === 0 ? (
              <ProfileStep name={name} onName={setName} initialImage={user.image ?? ""} onNext={() => setStep(1)} />
            ) : (
              <WorkspaceStep name={workspace} onName={setWorkspace} onBack={() => setStep(0)} onDone={onDone} />
            )}
          </div>
        </div>
      </div>
      <OnboardingPreview userName={name} workspaceName={workspace} />
    </div>
  );
}
