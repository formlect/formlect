import { PlusIcon } from "lucide-react"

export function AddFieldButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-border-strong text-[12.5px] text-ink-3 outline-none transition-colors hover:border-primary-300 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/20"
    >
      <PlusIcon className="size-3.5" />
      Add field or press <kbd className="font-mono">/</kbd>
    </button>
  )
}
