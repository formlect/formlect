import { FileTextIcon } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type FormSummary, timeAgo } from "@/lib/forms";
import { cn } from "cn";
import { FormMenu } from "./form-menu";
import { tone } from "./form-tone";
import { StatusBadge } from "./status-badge";

export function FormsTable({ forms }: { forms: FormSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
      <Table className="min-w-[640px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Responses</TableHead>
            <TableHead>Last activity</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {forms.map((f) => (
            <TableRow key={f.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <span className={cn("flex size-8 flex-none items-center justify-center rounded-lg text-ink-2", tone(f.id))}>
                    <FileTextIcon className="size-4" />
                  </span>
                  <Link href={`/builder/${f.id}`} className="max-w-72 truncate text-sm font-bold text-foreground hover:underline">{f.title}</Link>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge live={f.isPublished} />
              </TableCell>
              <TableCell className="text-right font-bold tabular-nums">{f.isPublished ? f.submissionCount.toLocaleString() : "—"}</TableCell>
              <TableCell className="text-muted-foreground">{timeAgo(f.updatedAt)}</TableCell>
              <TableCell>
                <FormMenu form={f} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
