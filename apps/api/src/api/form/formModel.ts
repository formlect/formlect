import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "@/common/utils/commonValidation";
import {
	FIELD_TYPES,
	FONT_PAIRS,
	FORM_LAYOUTS,
	FORM_STATUS,
	RESERVED_SLUGS,
	THEME_PRESETS,
} from "@/db/schema/constants";

extendZodWithOpenApi(z);

// Request models. Enums come from db/schema/constants.ts; length caps mirror the Mongoose schema (keep them in sync).
// Handlers receive the PARSED body (see validateRequest), so unknown keys never reach the database.

const key = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, "Invalid key");
// Generated slugs are mixed-case (nanoid); aliases are lowercase vanity links.
const slug = z.string().regex(/^[a-zA-Z0-9-]{3,80}$/, "Invalid slug");
const alias = z
	.string()
	.trim()
	.toLowerCase()
	.regex(/^[a-z0-9-]{3,40}$/, "Alias: 3-40 chars, lowercase letters, digits and dashes")
	.refine((a) => !RESERVED_SLUGS.has(a), "That alias is reserved");

export const OptionSchema = z.object({
	key,
	label: z.string().trim().min(1).max(500),
	imageUrl: z.string().url().max(2048).optional(),
	isOther: z.boolean().optional(),
});

export const FieldValidationSchema = z.object({
	minLength: z.number().int().min(0).optional(),
	maxLength: z.number().int().min(1).optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	step: z.number().min(0).optional(),
	pattern: z.string().max(500).optional(), // stored only; never executed server-side (ReDoS)
	patternMessage: z.string().max(200).optional(),
	minSelections: z.number().int().min(0).optional(),
	maxSelections: z.number().int().min(1).optional(),
	minDate: z.coerce.date().optional(),
	maxDate: z.coerce.date().optional(),
	maxFiles: z.number().int().min(1).max(50).optional(),
	maxFileSizeMB: z.number().min(0.1).max(1024).optional(),
	acceptedMimeTypes: z.array(z.string().max(120)).max(50).optional(),
});

export const FieldSchema = z.object({
	key,
	type: z.enum(FIELD_TYPES),
	name: z.string().trim().max(64).optional(),
	title: z.string().trim().max(1000).default(""),
	description: z.string().max(4000).optional(),
	placeholder: z.string().max(200).optional(),
	required: z.boolean().default(false),
	appearance: z.string().max(40).optional(),
	options: z.array(OptionSchema).max(200).optional(),
	randomizeOptions: z.boolean().optional(),
	scale: z
		.object({
			max: z.union([z.literal(3), z.literal(5), z.literal(7), z.literal(10)]).optional(),
			minLabel: z.string().max(60).optional(),
			maxLabel: z.string().max(60).optional(),
		})
		.optional(),
	validation: FieldValidationSchema.optional(),
	hidden: z.boolean().optional(),
	pageKey: z.string().max(64).optional(),
});
export type FieldInput = z.infer<typeof FieldSchema>;

const FieldsSchema = z.array(FieldSchema).max(500);

// Settings a client may change through this API. Webhooks, notifications, captcha and IP collection get their own
// endpoints (they need extra review: SSRF, PII), so they are not accepted here.
export const SettingsPatchSchema = z.object({
	acceptingResponses: z.boolean().optional(),
	opensAt: z.coerce.date().nullable().optional(),
	closesAt: z.coerce.date().nullable().optional(),
	responseLimit: z.number().int().min(1).nullable().optional(),
	oneResponsePerUser: z.boolean().optional(),
	requireLogin: z.boolean().optional(),
	allowEditAfterSubmit: z.boolean().optional(),
	saveProgress: z.boolean().optional(),
	closedMessage: z.string().max(1000).optional(),
	thankYou: z.object({ heading: z.string().max(200).optional(), message: z.string().max(2000).optional() }).optional(),
});

export const DesignPatchSchema = z.object({
	preset: z.enum(THEME_PRESETS).optional(),
	accent: z
		.string()
		.regex(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i)
		.nullable()
		.optional(),
	font: z.enum(FONT_PAIRS).optional(),
	layout: z.enum(FORM_LAYOUTS).optional(),
	corners: z.enum(["sharp", "soft", "round"]).optional(),
	button: z
		.object({ style: z.enum(["filled", "outline"]).optional(), label: z.string().trim().max(40).optional() })
		.optional(),
	showProgress: z.boolean().optional(),
});

// Response model (documentation). The JSON has `id`, not `_id`; design/page/settings are documented as open objects.
export const FormSchema = z.object({
	id: z.string(),
	workspace: z.string(),
	createdBy: z.string(),
	title: z.string(),
	description: z.string().optional(),
	slug: z.string().optional(),
	alias: z.string().optional(),
	status: z.enum(FORM_STATUS),
	tags: z.array(z.string()),
	fields: z.array(FieldSchema),
	logic: z.array(z.record(z.unknown())),
	design: z.record(z.unknown()),
	page: z.record(z.unknown()),
	settings: z.record(z.unknown()),
	publishedVersion: z.string().optional(),
	publishedAt: z.unknown().optional(),
	revision: z.number(),
	hasUnpublishedChanges: z.boolean(),
	stats: z.object({
		views: z.number(),
		starts: z.number(),
		responses: z.number(),
		lastResponseAt: z.unknown().optional(),
	}),
	createdAt: z.unknown(),
	updatedAt: z.unknown(),
});
export type Form = z.infer<typeof FormSchema>;

// The dashboard list omits the heavy parts of the form.
export const FormSummarySchema = FormSchema.pick({
	id: true,
	workspace: true,
	title: true,
	slug: true,
	status: true,
	tags: true,
	publishedAt: true,
	stats: true,
	createdAt: true,
	updatedAt: true,
});

// What a respondent gets: the PUBLISHED snapshot only, without owner ids, collaborators, counters or webhooks.
export const PublicFormSchema = z.object({
	id: z.string(),
	slug: z.string(),
	versionId: z.string(),
	title: z.string(),
	description: z.string().optional(),
	fields: z.array(FieldSchema),
	logic: z.array(z.record(z.unknown())),
	design: z.record(z.unknown()),
	page: z.record(z.unknown()),
	acceptingResponses: z.boolean(),
	closedMessage: z.string().optional(),
	thankYou: z.record(z.unknown()).optional(),
});

export const CreateFormSchema = z.object({
	body: z.object({
		title: z.string().trim().min(1, "Title is required").max(200, "Title too long"),
		description: z.string().max(4000, "Description too long").optional(),
		alias: alias.optional(),
		tags: z.array(z.string().trim().toLowerCase().max(40)).max(30).optional(),
		fields: FieldsSchema.optional(),
	}),
});
export type CreateFormInput = z.infer<typeof CreateFormSchema>["body"];

export const IdParamSchema = z.object({ id: commonValidations.id });
export const SlugParamSchema = z.object({ slug });

export const BasicInformationSchema = z.object({
	title: z.string().trim().min(1).max(200).optional(),
	description: z.string().max(4000).optional(),
	settings: SettingsPatchSchema.optional(),
	design: DesignPatchSchema.optional(),
});
export type BasicInformation = z.infer<typeof BasicInformationSchema>;

export const UpdateBasicInformationSchema = z.object({ params: IdParamSchema, body: BasicInformationSchema });
export const UpdateFieldsSchema = z.object({ params: IdParamSchema, body: z.object({ fields: FieldsSchema }) });
export const UpdatePublishSchema = z.object({ params: IdParamSchema, body: z.object({ publish: z.boolean() }) });
export const GetFormSchema = z.object({ params: IdParamSchema });
export const GetFormBySlugSchema = z.object({ params: SlugParamSchema });
