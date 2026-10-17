"use client";

import { EllipsisIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FormSummary } from "@/lib/forms";
import { useFormsStore } from "@/stores/forms-store";

export function FormMenu({ form, className }: { form: FormSummary; className?: string }) {
  const togglePublish = useFormsStore((s) => s.togglePublish);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="More" className={className} />}>
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={() => togglePublish(form)}>{form.isPublished ? "Unpublish" : "Publish"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
