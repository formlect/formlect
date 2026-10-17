import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GithubIcon } from "./github-icon";

export function BrandPanel() {
  return (
    <div className="relative flex h-full flex-col justify-between gap-10 overflow-hidden rounded-3xl bg-brand px-11 py-12">
      <div className="flex max-w-[440px] flex-col gap-3.5">
        <h2 className="font-heading text-[clamp(28px,3vw,38px)] font-semibold leading-[1.1] tracking-[-0.03em] text-white text-balance">
          Forms people actually enjoy filling out.
        </h2>
        <p className="text-base leading-normal text-[#ddd5fb]">
          Build in minutes, publish anywhere, and see answers arrive as structured data.
        </p>
      </div>

      <div className="relative w-full max-w-[400px] self-center">
        <div className="absolute inset-0 translate-y-[22px] scale-[.92] rounded-[18px] bg-[#6b50dc]" />
        <Card className="relative gap-3.5 rounded-[18px] border-0 p-6 shadow-[0_24px_48px_-16px_rgba(16,8,60,.45)]">
          <Progress value={60} aria-label="Form progress" className="block [&_[data-slot=progress-track]]:h-1" />
          <span className="font-mono text-[11.5px] text-brand">3 →</span>
          <span className="font-heading text-lg font-semibold tracking-[-0.015em] text-ink">
            Which programme are you applying for?
          </span>
          <div className="flex h-11 items-center gap-2.5 rounded-[11px] border-[1.5px] border-brand bg-brand-soft px-3 text-sm font-bold text-ink">
            <span className="flex size-[22px] items-center justify-center rounded-md bg-brand font-mono text-[10.5px] text-white">
              A
            </span>
            Community health
            <Check className="ml-auto size-4 text-brand" />
          </div>
          <div className="flex h-11 items-center gap-2.5 rounded-[11px] border-[1.5px] border-border px-3 text-sm font-semibold text-ink">
            <span className="flex size-[22px] items-center justify-center rounded-md border border-border-strong font-mono text-[10.5px] text-ink-3">
              B
            </span>
            Education access
          </div>
        </Card>
        <div className="absolute -right-3.5 -top-[18px] flex items-center gap-2 rounded-xl bg-white px-3 py-[9px] text-[12.5px] font-bold text-ink shadow-[0_12px_28px_-10px_rgba(16,8,60,.4)]">
          <span className="size-2 rounded-full bg-coral shadow-[0_0_0_3px_#ffe3d5]" />
          New response · just now
        </div>
      </div>

      <div className="flex items-center gap-2.5 text-[13.5px] text-[#ddd5fb]">
        <GithubIcon className="size-4 text-white" />
        <span>Open source. Self-host it or use Formlect Cloud.</span>
      </div>
    </div>
  );
}
