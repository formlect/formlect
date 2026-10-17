"use client"

import { cn } from "cn"
import { AlertCircleIcon, UploadIcon, XIcon } from "lucide-react"
import { useRef, useState } from "react"

type FileDropzoneProps = {
  files: File[]
  onFilesChange: (files: File[]) => void
  /** Lower-case extensions without the dot. */
  extensions?: string[]
  maxSizeMB?: number
  maxFiles?: number
  className?: string
}

const DEFAULT_EXT = ["jpg", "jpeg", "png", "gif", "webp", "heic", "pdf", "doc", "docx", "csv"]

// UI + client-side checks only. There is no upload endpoint in apps/api yet; when one is added, the server must
// re-validate type, size and count (client checks are a UX aid, not a control). See brain/security F-20.
export function FileDropzone({
  files,
  onFilesChange,
  extensions = DEFAULT_EXT,
  maxSizeMB = 10,
  maxFiles = 3,
  className,
}: FileDropzoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState("")

  function add(list: FileList | null) {
    if (!list) return
    const next = [...files]
    let err = ""
    for (const f of Array.from(list)) {
      if (next.length >= maxFiles) { err = `You can upload up to ${maxFiles} files.`; break }
      const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
      if (!extensions.includes(ext)) { err = `${f.name} isn't a supported file type.`; continue }
      if (f.size > maxSizeMB * 1048576) { err = `${f.name} is over the ${maxSizeMB} MB limit.`; continue }
      next.push(f)
    }
    setError(err)
    onFilesChange(next)
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept={extensions.map((e) => `.${e}`).join(",")}
        onChange={(e) => { add(e.target.files); e.target.value = "" }}
      />
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), input.current?.click())}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files) }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-[1.5px] border-dashed px-5 pt-6 pb-5 text-center outline-none transition-all duration-200 focus-visible:ring-3 focus-visible:ring-ring/20",
          drag ? "scale-[1.01] border-primary bg-tint" : "border-input bg-card hover:border-primary-400 hover:bg-tint-soft"
        )}
      >
        <span className="flex h-[46px] w-10 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]">
          <UploadIcon className="size-5" />
        </span>
        <span className="text-[14.5px] font-extrabold">{drag ? "Drop to add" : "Drag files here or browse"}</span>
        <span className="text-[12.5px] text-muted-foreground">
          {extensions.map((e) => e.toUpperCase()).join(", ")} · up to {maxSizeMB} MB · {maxFiles} files
        </span>
      </div>
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-[10px] border border-destructive-border bg-destructive-soft px-3 py-2 text-[13px] font-semibold text-destructive">
          <AlertCircleIcon className="size-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setError("")} className="rounded-md p-1 hover:bg-highlight-soft">
            <XIcon className="size-3.5" />
          </button>
        </div>
      )}
      {files.map((f, i) => (
        <div key={`${f.name}-${i}`} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[9px] bg-accent text-[9.5px] font-medium text-accent-foreground uppercase">
            {f.name.split(".").pop()}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{f.name}</span>
          <span className="text-[12.5px] text-muted-foreground tabular-nums">{(f.size / 1048576).toFixed(1)} MB</span>
          <button
            type="button"
            aria-label={`Remove ${f.name}`}
            onClick={() => { setError(""); onFilesChange(files.filter((_, j) => j !== i)) }}
            className="flex size-[30px] items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-secondary hover:text-foreground"
          >
            <XIcon className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
