import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-fl-shimmer rounded-md bg-[linear-gradient(90deg,var(--skeleton)_0,var(--skeleton-hl)_60px,var(--skeleton)_120px)] bg-[length:400px_100%]", className)}
      {...props}
    />
  )
}

export { Skeleton }
