import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import {
	BasicInformationSchema,
	CreateFormSchema,
	FieldSchema,
	FormSchema,
	FormSummarySchema,
	GetFormBySlugSchema,
	GetFormSchema,
	IdParamSchema,
	PublicFormSchema,
	SlugParamSchema,
	UpdateBasicInformationSchema,
	UpdateFieldsSchema,
	UpdatePublishSchema,
} from "@/api/form/formModel";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";
import { validateRequest } from "@/common/utils/httpHandlers";
import { formController } from "./formController";

export const formRegistry = new OpenAPIRegistry();
export const formRouter: Router = express.Router();

formRegistry.register("Form", FormSchema);

const jsonBody = <T extends z.ZodTypeAny>(schema: T) => ({ content: { "application/json": { schema } } });

// GET /api/v1/forms
formRegistry.registerPath({
	method: "get",
	path: "/api/v1/forms",
	tags: ["Form"],
	responses: createApiResponse(z.object({ forms: z.array(FormSummarySchema), total: z.number() }), "Success"),
});
formRouter.get("/", requireAuth, formController.getForms);

// GET /api/v1/forms/by-slug/:slug  (registered before "/:id" so "by-slug" is not read as an id)
formRegistry.registerPath({
	method: "get",
	path: "/api/v1/forms/by-slug/{slug}",
	tags: ["Form"],
	request: { params: SlugParamSchema },
	responses: createApiResponse(PublicFormSchema, "Success"),
});
formRouter.get("/by-slug/:slug", requireAuth, validateRequest(GetFormBySlugSchema), formController.getFormBySlug);

// GET /api/v1/forms/:id
formRegistry.registerPath({
	method: "get",
	path: "/api/v1/forms/{id}",
	tags: ["Form"],
	request: { params: IdParamSchema },
	responses: createApiResponse(FormSchema, "Success"),
});
formRouter.get("/:id", requireAuth, validateRequest(GetFormSchema), formController.getFormById);

// POST /api/v1/forms/create
formRegistry.registerPath({
	method: "post",
	path: "/api/v1/forms/create",
	tags: ["Form"],
	request: { body: jsonBody(CreateFormSchema.shape.body) },
	responses: createApiResponse(FormSchema, "Success"),
});
formRouter.post("/create", requireAuth, validateRequest(CreateFormSchema), formController.createForm);

// PATCH /api/v1/forms/:id/basic-information
formRegistry.registerPath({
	method: "patch",
	path: "/api/v1/forms/{id}/basic-information",
	tags: ["Form"],
	request: { params: IdParamSchema, body: jsonBody(BasicInformationSchema) },
	responses: createApiResponse(FormSchema, "Success"),
});
formRouter.patch(
	"/:id/basic-information",
	requireAuth,
	validateRequest(UpdateBasicInformationSchema),
	formController.updateBasicInformation,
);

// PATCH /api/v1/forms/:id/fields
formRegistry.registerPath({
	method: "patch",
	path: "/api/v1/forms/{id}/fields",
	tags: ["Form"],
	request: { params: IdParamSchema, body: jsonBody(z.object({ fields: z.array(FieldSchema) })) },
	responses: createApiResponse(FormSchema, "Success"),
});
formRouter.patch("/:id/fields", requireAuth, validateRequest(UpdateFieldsSchema), formController.updateFormFields);

// PATCH /api/v1/forms/:id/publish
formRegistry.registerPath({
	method: "patch",
	path: "/api/v1/forms/{id}/publish",
	tags: ["Form"],
	request: { params: IdParamSchema, body: jsonBody(z.object({ publish: z.boolean() })) },
	responses: createApiResponse(FormSchema, "Success"),
});
formRouter.patch(
	"/:id/publish",
	requireAuth,
	validateRequest(UpdatePublishSchema),
	formController.updateFormPublishStatus,
);
