export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative size-[30px] flex-none rounded-[9px] bg-brand">
        <span className="absolute inset-x-[7px] bottom-2 h-[3px] rounded-sm bg-white" />
        <span className="absolute left-[7px] top-[7px] size-2 rounded-[3px] bg-coral" />
      </div>
      <span className="font-heading text-[17px] font-semibold tracking-[-0.02em]">formlect</span>
    </div>
  );
}
