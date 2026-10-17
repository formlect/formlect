import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { formRegistry } from "@/api/form/formRouter";
import { formResponseRegistry } from "@/api/formResponse/formResponseRouter";
import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { onboardingRegistry } from "@/api/onboarding/onboardingRouter";
import { workspaceRegistry } from "@/api/workspace/workspaceRouter";

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([
		healthCheckRegistry,
		formRegistry,
		formResponseRegistry,
		onboardingRegistry,
		workspaceRegistry,
	]);
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Swagger API",
		},
		externalDocs: {
			description: "View the raw OpenAPI Specification in JSON format",
			url: "/swagger.json",
		},
	});
}
