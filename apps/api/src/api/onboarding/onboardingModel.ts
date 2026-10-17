import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

// Name and avatar are saved through Better Auth's update-user; this finishes onboarding with the workspace step.
export const CompleteOnboardingSchema = z.object({
	body: z.object({ workspaceName: z.string().trim().min(1).max(80) }),
});

export const OnboardingResultSchema = z.object({ workspace: z.object({ id: z.string(), name: z.string() }) });
