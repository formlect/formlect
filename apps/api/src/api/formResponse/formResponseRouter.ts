import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";
import { validateRequest } from "@/common/utils/httpHandlers";
import { formResponseController } from "./formResponseController";
import { CreateFormResponseSchema, FormResponseSchema, SubmittedResponseSchema } from "./formResponseModel";

export const formResponseRegistry = new OpenAPIRegistry();
export const formResponseRouter: Router = express.Router();

formResponseRegistry.register("FormResponse", FormResponseSchema);

// POST /api/v1/form-response/create
formResponseRegistry.registerPath({
	method: "post",
	path: "/api/v1/form-response/create",
	tags: ["Form Response"],
	request: {
		body: {
			content: { "application/json": { schema: CreateFormResponseSchema.shape.body } },
		},
	},
	responses: createApiResponse(SubmittedResponseSchema, "Success"),
});

formResponseRouter.post(
	"/create",
	requireAuth,
	validateRequest(CreateFormResponseSchema),
	formResponseController.createFormResponse,
);
