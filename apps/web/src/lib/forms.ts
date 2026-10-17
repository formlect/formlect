import { api } from "./api";

// What the API returns for a form (see apps/api/src/api/form/formModel.ts). Only the parts the dashboard reads.
type ApiForm = {
  id: string;
  title: string;
  slug?: string;
  status: "draft" | "published" | "closed" | "archived";
  publishedAt?: string | null;
  stats?: { responses?: number };
  createdAt: string;
  updatedAt: string;
};

// The dashboard's view of a form.
export type FormSummary = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  publishedAt: string | null;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export const toSummary = (f: ApiForm): FormSummary => ({
  id: f.id,
  title: f.title,
  slug: f.slug ?? "",
  isPublished: f.status === "published",
  publishedAt: f.publishedAt ?? null,
  submissionCount: f.stats?.responses ?? 0,
  createdAt: f.createdAt,
  updatedAt: f.updatedAt,
});

export const listForms = () => api<{ forms: ApiForm[]; total: number }>("/api/v1/forms").then((r) => r.forms.map(toSummary));

// The API generates the slug.
export const createForm = (title: string) =>
  api<ApiForm>("/api/v1/forms/create", { method: "POST", body: { title: title.slice(0, 200) } }).then(toSummary);

export const setPublished = (id: string, publish: boolean) =>
  api<ApiForm>(`/api/v1/forms/${id}/publish`, { method: "PATCH", body: { publish } }).then(toSummary);

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];

export function timeAgo(iso: string) {
  const secs = (new Date(iso).getTime() - Date.now()) / 1000;
  const [unit, size] = UNITS.find(([, s]) => Math.abs(secs) >= s) ?? ["minute", 60];
  return Math.abs(secs) < 60 ? "Just now" : rtf.format(Math.round(secs / size), unit);
}
