import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";
import { validateRequest } from "@/common/utils/httpHandlers";
import { onboardingController } from "./onboardingController";
import { CompleteOnboardingSchema, OnboardingResultSchema } from "./onboardingModel";

export const onboardingRegistry = new OpenAPIRegistry();
export const onboardingRouter: Router = express.Router();

// POST /api/v1/onboarding/complete
onboardingRegistry.registerPath({
	method: "post",
	path: "/api/v1/onboarding/complete",
	tags: ["Onboarding"],
	request: { body: { content: { "application/json": { schema: CompleteOnboardingSchema.shape.body } } } },
	responses: createApiResponse(OnboardingResultSchema, "Success"),
});

onboardingRouter.post(
	"/complete",
	requireAuth,
	validateRequest(CompleteOnboardingSchema),
	onboardingController.complete,
);
