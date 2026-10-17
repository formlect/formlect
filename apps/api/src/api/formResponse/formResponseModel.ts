import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "@/common/utils/commonValidation";
import { FIELD_TYPES } from "@/db/schema/constants";

extendZodWithOpenApi(z);

// One answer per field, in a typed slot (mirrors db/schema/response/AnswerSchema.ts). Which slot a field uses is
// decided by its type; the server checks that in formResponseValidation.ts.
export const AnswerInputSchema = z.object({
	fieldKey: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
	text: z.string().max(20000).optional(),
	number: z.number().finite().optional(),
	boolean: z.boolean().optional(),
	date: z.coerce.date().optional(),
	choices: z.array(z.string().max(64)).max(200).optional(),
	otherText: z.string().max(1000).optional(),
	skipped: z.boolean().optional(),
});
export type AnswerInput = z.infer<typeof AnswerInputSchema>;

export const CreateFormResponseSchema = z.object({
	body: z.object({
		formId: commonValidations.id,
		answers: z.array(AnswerInputSchema).max(500),
		// utm_source, ref, ... from the URL
		hiddenFields: z
			.record(z.string().max(500))
			.refine((o) => Object.keys(o).length <= 20, "At most 20 hidden fields")
			.optional(),
	}),
});
export type CreateFormResponseInput = z.infer<typeof CreateFormResponseSchema>["body"];

export const FormResponseSchema = z.object({
	id: z.string(),
	number: z.number(),
	form: z.string(),
	status: z.enum(["partial", "completed", "spam"]),
	answers: z.array(AnswerInputSchema.extend({ fieldType: z.enum(FIELD_TYPES) })),
	createdAt: z.unknown(),
});

// What the submit endpoint returns: enough to show a confirmation, nothing about other responses.
export const SubmittedResponseSchema = z.object({ id: z.string(), number: z.number() });
