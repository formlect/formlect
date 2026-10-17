import { randomBytes } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { trusted } from "mongoose";
import {
  ensurePersonalWorkspace,
  membershipsOf,
} from "@/api/workspace/workspaceAccess";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { toServiceFailure } from "@/common/utils/mongoErrors";
import { generateUniqueSlug } from "@/common/utils/slugGenerator";
import { Form, FormVersion, isAcceptingResponses, roleOf } from "@/db/schema";
import type {
  BasicInformation,
  CreateFormInput,
  FieldInput,
  Form as FormDto,
} from "./formModel";

type Actor = { id: string; name?: string };
type Settable = { set(path: string, value: unknown): unknown };

const EDIT_ROLES = ["owner", "admin", "editor"];
const MAX_SLUG_INSERTS = 3;

// E11000 on a given unique index (`keyPattern` names the field that collided).
const isDuplicateOn = (ex: unknown, field: string) => {
  const e = ex as { code?: number; keyPattern?: Record<string, unknown> };
  return e?.code === 11000 && !!e.keyPattern && field in e.keyPattern;
};

const notFound = () =>
  ServiceResponse.failure<null>("Form not found", null, StatusCodes.NOT_FOUND);
const forbidden = () =>
  ServiceResponse.failure<null>(
    "You don't have permission to edit this form",
    null,
    StatusCodes.FORBIDDEN,
  );

const makeSlug = (title: string) =>
  `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "form"
  }-${randomBytes(4).toString("hex")}`;

// Sets `{ a: { b: 1 } }` as `prefix.a.b` so a partial patch never wipes sibling keys. Dates, arrays and null are leaves.
function setPaths(
  doc: Settable,
  prefix: string,
  patch: Record<string, unknown>,
) {
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date))
      setPaths(doc, `${prefix}.${k}`, v as Record<string, unknown>);
    else doc.set(`${prefix}.${k}`, v);
  }
}

// A user can reach a form through a workspace they belong to or as a per-form collaborator. This is the only
// place that decides that, so every read/write goes through it (ownership is part of the query, not checked after).
async function accessFilter(userId: string) {
  const roles = await membershipsOf(userId);
  return {
    roles,
    or: [
      { workspace: trusted({ $in: [...roles.keys()] }) },
      { "collaborators.user": userId },
    ],
  };
}

async function findForMember(formId: string, userId: string) {
  const { roles, or } = await accessFilter(userId);
  const form = await Form.findOne({ _id: formId, $or: or });
  if (!form) return null;
  const role = roles.get(String(form.workspace)) ?? roleOf(form, userId);
  return { form, canEdit: !!role && EDIT_ROLES.includes(role) };
}

const toDto = (doc: { toJSON(): unknown }) =>
  doc.toJSON() as unknown as FormDto;

export class FormService {
  async createForm(user: Actor, data: CreateFormInput) {
    try {
      const workspace = await ensurePersonalWorkspace(user);
      for (let attempt = 1; ; attempt++) {
        const slug = await generateUniqueSlug(this);
        try {
          const form = await Form.create({
            workspace,
            createdBy: user.id,
            title: data.title,
            description: data.description,
            slug,
            alias: data.alias,
            tags: data.tags,
            fields: data.fields,
          });
          return ServiceResponse.success<FormDto>(
            "Form created successfully",
            toDto(form),
            StatusCodes.CREATED,
          );
        } catch (ex) {
          // The availability check and the insert are separate steps, so a concurrent request can take the same slug in
          // between. The unique index rejects the loser; it just draws a new slug.
          if (isDuplicateOn(ex, "slug") && attempt < MAX_SLUG_INSERTS) continue;
          if (isDuplicateOn(ex, "alias"))
            return ServiceResponse.failure<null>(
              "That alias is already taken",
              null,
              StatusCodes.CONFLICT,
            );
          throw ex;
        }
      }
    } catch (ex) {
      return toServiceFailure(ex, "creating the form");
    }
  }

  async getFormsByUserId(userId: string) {
    try {
      const { or } = await accessFilter(userId);
      const forms = await Form.find({ $or: or })
        .select(
          "workspace title slug status tags publishedAt stats createdAt updatedAt",
        )
        .sort({ createdAt: -1 });
      return ServiceResponse.success("Forms fetched successfully", {
        forms: forms.map(toDto),
        total: forms.length,
      });
    } catch (ex) {
      return toServiceFailure(ex, "fetching forms");
    }
  }

  async getformById(formId: string, userId: string) {
    try {
      const found = await findForMember(formId, userId);
      if (!found) return notFound();
      return ServiceResponse.success<FormDto>(
        "Form fetched successfully",
        toDto(found.form),
      );
    } catch (ex) {
      return toServiceFailure(ex, "fetching the form");
    }
  }

  // What a respondent renders: the published snapshot only, never the draft, owner ids, counters or webhooks.
  async getformBySlug(slug: string) {
    try {
      // A real slug wins over an alias, so an alias can never shadow another form's link.
      const select = "slug publishedVersion settings stats status";
      const form =
        (await Form.findOne({ slug, status: "published" }).select(select)) ??
        (await Form.findOne({
          alias: slug.toLowerCase(),
          status: "published",
        }).select(select));
      if (!form?.publishedVersion) return notFound();
      const version = await FormVersion.findById(form.publishedVersion)
        .select("snapshot")
        .lean();
      if (!version) return notFound();

      const { fields, logic, design, page, title, description } =
        version.snapshot as Record<string, unknown> & {
          page?: Record<string, unknown>;
        };
      const { enabledBy: _by, enabledAt: _at, ...publicPage } = page ?? {};
      return ServiceResponse.success("Form fetched successfully", {
        id: String(form._id),
        slug: form.slug,
        versionId: String(version._id),
        title,
        description,
        fields,
        logic,
        design,
        page: publicPage,
        acceptingResponses: isAcceptingResponses(form),
        closedMessage: form.settings?.closedMessage,
        thankYou: form.settings?.thankYou,
      });
    } catch (ex) {
      return toServiceFailure(ex, "fetching the form");
    }
  }

  // title, description, a safe subset of settings, and design.showProgress
  async updateBasicInformation(
    formId: string,
    userId: string,
    data: BasicInformation,
  ) {
    try {
      const found = await findForMember(formId, userId);
      if (!found) return notFound();
      if (!found.canEdit) return forbidden();
      const { form } = found;

      if (data.title !== undefined) form.title = data.title;
      if (data.description !== undefined) form.description = data.description;
      if (data.settings) setPaths(form, "settings", data.settings);
      if (data.design) setPaths(form, "design", data.design);
      form.updatedBy = userId as never;
      await form.save(); // save (not findOneAndUpdate) so schema validators, the revision bump and optimistic concurrency run

      return ServiceResponse.success<FormDto>(
        "Form basic information updated successfully",
        toDto(form),
      );
    } catch (ex) {
      return toServiceFailure(ex, "updating form basic information");
    }
  }

  async updateFormFields(formId: string, userId: string, fields: FieldInput[]) {
    try {
      const found = await findForMember(formId, userId);
      if (!found) return notFound();
      if (!found.canEdit) return forbidden();
      const { form } = found;

      form.set("fields", fields);
      form.updatedBy = userId as never;
      await form.save();

      return ServiceResponse.success<FormDto>(
        "Form fields updated successfully",
        toDto(form),
      );
    } catch (ex) {
      return toServiceFailure(ex, "updating form fields");
    }
  }

  // Publishing freezes the draft into an immutable FormVersion; respondents always answer against that snapshot.
  async updateFormPublishStatus(
    formId: string,
    userId: string,
    publish: boolean,
  ) {
    try {
      const found = await findForMember(formId, userId);
      if (!found) return notFound();
      if (!found.canEdit) return forbidden();
      const { form } = found;

      if (publish) {
        const last = await FormVersion.findOne({ form: form._id })
          .sort({ number: -1 })
          .select("number");
        const draft = form.toObject();
        const version = await FormVersion.create({
          form: form._id,
          workspace: form.workspace,
          number: (last?.number ?? 0) + 1,
          kind: "published",
          createdBy: userId,
          fromRevision: form.revision,
          snapshot: {
            title: draft.title,
            description: draft.description,
            fields: draft.fields,
            logic: draft.logic,
            variables: draft.variables,
            design: draft.design,
            page: draft.page,
            settings: draft.settings,
          },
        });
        form.set({
          status: "published",
          publishedVersion: version._id,
          publishedAt: new Date(),
          hasUnpublishedChanges: false,
        });
      } else {
        form.set({ status: "draft", publishedAt: undefined });
      }
      form.updatedBy = userId as never;
      await form.save();

      return ServiceResponse.success<FormDto>(
        "Form publish status updated successfully",
        toDto(form),
      );
    } catch (ex) {
      return toServiceFailure(ex, "updating form publish status");
    }
  }

  async checkSlugAvailability(slug: string) {
    try {
      const exists = await Form.exists({ slug }).collation({ locale: "en", strength: 2 });

      return ServiceResponse.success("Slug checked", {
        available: exists ? false : true,
      });
    } catch (ex) {
      return toServiceFailure(ex, "checking slug availability");
    }
  }
}
