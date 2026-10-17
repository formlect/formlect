import { api } from "@/lib/api";
import { type Field, type FieldType, mk } from "./model";

// The API has 18 field types (apps/api/src/db/schema/constants.ts); the builder has 18 too, but they only overlap on 14.
// Only the overlap is saved. The rest (date-time, image, audio, video), logic and theme live in the browser session.
const TO_API: Partial<Record<FieldType, string>> = {
  short: "short_text", long: "long_text", email: "email", phone: "phone", url: "url", number: "number",
  single: "single_choice", multiple: "multiple_choice", select: "dropdown", range: "range", rating: "rating",
  date: "date", time: "time", file: "file_upload",
};
const FROM_API: Record<string, FieldType> = {
  ...Object.fromEntries(Object.entries(TO_API).map(([b, a]) => [a, b as FieldType])),
  yes_no: "single", nps: "range", opinion_scale: "rating",
};

export const isPersisted = (t: FieldType) => t in TO_API;

type ApiField = {
  key: string;
  type: string;
  name?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  appearance?: string;
  options?: { key: string; label: string }[];
  scale?: { max?: number; minLabel?: string; maxLabel?: string };
  validation?: { min?: number; max?: number };
};

type ApiLoadedForm = {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  status: string;
  stats?: { responses?: number };
  fields: ApiField[];
  settings?: { oneResponsePerUser?: boolean } | null;
  design?: { showProgress?: boolean } | null;
};

export type LoadedForm = {
  id: string;
  title: string;
  description: string;
  slug: string;
  isPublished: boolean;
  submissionCount: number;
  fields: ApiField[];
  settings: { allowMultipleSubmissions: boolean; showProgressBar: boolean };
};

export const loadForm = (id: string) =>
  api<ApiLoadedForm>(`/api/v1/forms/${id}`).then(
    (f): LoadedForm => ({
      id: f.id,
      title: f.title,
      description: f.description ?? "",
      slug: f.slug ?? "",
      isPublished: f.status === "published",
      submissionCount: f.stats?.responses ?? 0,
      fields: f.fields ?? [],
      settings: { allowMultipleSubmissions: !f.settings?.oneResponsePerUser, showProgressBar: f.design?.showProgress ?? true },
    }),
  );

const LOOKS = ["cards", "list", "pills"];
const RATING_STYLES = ["stars", "numbers"];

export function fieldsFromApi(fields: ApiField[]): Field[] {
  return fields.flatMap((e) => {
    const type = FROM_API[e.type];
    if (!type) return [];
    const opts = e.options?.map((o) => o.label) ?? [];
    const isChoice = type === "single" || type === "multiple" || type === "select";
    return [
      mk(type, {
        id: e.key,
        label: e.title ?? "",
        help: e.description ?? "",
        ph: e.placeholder ?? "",
        required: !!e.required,
        key: e.name ?? "",
        options: isChoice ? (opts.length ? opts : e.type === "yes_no" ? ["Yes", "No"] : ["Option 1"]) : null,
        ...(isChoice && e.appearance && LOOKS.includes(e.appearance) ? { look: e.appearance as Field["look"] } : {}),
        ...(type === "rating" && e.appearance && RATING_STYLES.includes(e.appearance) ? { rstyle: e.appearance as Field["rstyle"] } : {}),
        ...(type === "rating" && e.scale?.max ? { max: e.scale.max } : {}),
        ...(type === "range" || type === "number" ? { min: e.validation?.min ?? null, max: e.validation?.max ?? null } : {}),
        ...(type === "range" ? { minLabel: e.scale?.minLabel ?? "", maxLabel: e.scale?.maxLabel ?? "" } : {}),
      }),
    ];
  });
}

const RATING_MAX = [3, 5, 7, 10];

function fieldToApi(f: Field) {
  const isChoice = f.type === "single" || f.type === "multiple" || f.type === "select";
  const labels = f.options?.length ? f.options : ["Option 1"];
  return {
    key: f.id,
    type: TO_API[f.type]!,
    name: f.key || undefined,
    title: f.label.slice(0, 1000),
    description: f.help ? f.help.slice(0, 4000) : undefined,
    placeholder: f.ph ? f.ph.slice(0, 200) : undefined,
    required: f.required,
    appearance: f.type === "single" || f.type === "multiple" ? f.look : f.type === "rating" ? f.rstyle : undefined,
    options: isChoice ? labels.map((label, j) => ({ key: `o${j}`, label: label.trim().slice(0, 500) || `Option ${j + 1}` })) : undefined,
    scale:
      f.type === "rating" && f.max && RATING_MAX.includes(f.max)
        ? { max: f.max }
        : f.type === "range"
          ? { minLabel: f.minLabel.slice(0, 60), maxLabel: f.maxLabel.slice(0, 60) }
          : undefined,
    validation: f.type === "range" || f.type === "number" ? { min: f.min ?? undefined, max: f.max ?? undefined } : undefined,
  };
}

export async function saveForm(id: string, s: { title: string; description: string; fields: Field[]; settings: LoadedForm["settings"] }) {
  if (s.title.trim()) {
    await api(`/api/v1/forms/${id}/basic-information`, {
      method: "PATCH",
      body: {
        title: s.title.slice(0, 200),
        description: s.description.slice(0, 4000),
        settings: { oneResponsePerUser: !s.settings.allowMultipleSubmissions },
        design: { showProgress: s.settings.showProgressBar },
      },
    });
  }
  await api(`/api/v1/forms/${id}/fields`, { method: "PATCH", body: { fields: s.fields.filter((f) => isPersisted(f.type)).map(fieldToApi) } });
}
