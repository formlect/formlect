import { toast } from "sonner";
import { create } from "zustand";
import { createForm, type FormSummary, listForms, setPublished } from "@/lib/forms";

type FormsState = {
  forms: FormSummary[];
  status: "loading" | "ready" | "error";
  load: () => Promise<void>;
  /** Resolves to the new form, or null if it failed (a toast has already been shown). */
  create: (title: string) => Promise<FormSummary | null>;
  togglePublish: (form: FormSummary) => Promise<void>;
  reset: () => void;
};

// Everything about the signed-in user's forms: the list, its load status and the actions that change it.
export const useFormsStore = create<FormsState>()((set) => ({
  forms: [],
  status: "loading",

  load: async () => {
    set({ status: "loading" });
    try {
      set({ forms: await listForms(), status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  create: async (title) => {
    try {
      const form = await createForm(title);
      set((s) => ({ forms: [form, ...s.forms] }));
      toast.success("Form created");
      return form;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the form.");
      return null;
    }
  },

  togglePublish: async (form) => {
    try {
      const updated = await setPublished(form.id, !form.isPublished);
      set((s) => ({ forms: s.forms.map((x) => (x.id === updated.id ? updated : x)) }));
      toast.success(updated.isPublished ? "Form is live" : "Form unpublished");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update the form.");
    }
  },

  reset: () => set({ forms: [], status: "loading" }),
}));
