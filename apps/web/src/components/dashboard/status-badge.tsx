import { Badge } from "@/components/ui/badge";

export function StatusBadge({ live }: { live: boolean }) {
  return live ? (
    <Badge variant="success">
      <span className="size-1.5 rounded-full bg-success" />
      Live
    </Badge>
  ) : (
    <Badge variant="draft">
      <span className="size-1.5 rounded-full bg-ink-3" />
      Draft
    </Badge>
  );
}
