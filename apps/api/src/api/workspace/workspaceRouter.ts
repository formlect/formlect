import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { requireAuth } from "@/common/middleware/requireAuth";
import { validateRequest } from "@/common/utils/httpHandlers";
import { workspaceController } from "./workspaceController";
import {
	CreateWorkspaceBodySchema,
	CreateWorkspaceSchema,
	DeleteWorkspaceSchema,
	GetWorkspaceSchema,
	IdParamSchema,
	UpdateWorkspaceBodySchema,
	UpdateWorkspaceSchema,
	WorkspaceSchema,
} from "./workspaceModel";

export const workspaceRegistry = new OpenAPIRegistry();
export const workspaceRouter: Router = express.Router();

workspaceRegistry.register("Workspace", WorkspaceSchema);

const jsonBody = <T extends z.ZodTypeAny>(schema: T) => ({ content: { "application/json": { schema } } });

// GET /api/v1/workspaces  (every workspace the caller is a member of)
workspaceRegistry.registerPath({
	method: "get",
	path: "/api/v1/workspaces",
	tags: ["Workspace"],
	responses: createApiResponse(z.object({ workspaces: z.array(WorkspaceSchema), total: z.number() }), "Success"),
});
workspaceRouter.get("/", requireAuth, workspaceController.getWorkspaces);

// POST /api/v1/workspaces/create  (the caller becomes owner)
workspaceRegistry.registerPath({
	method: "post",
	path: "/api/v1/workspaces/create",
	tags: ["Workspace"],
	request: { body: jsonBody(CreateWorkspaceBodySchema) },
	responses: createApiResponse(WorkspaceSchema, "Success"),
});
workspaceRouter.post(
	"/create",
	requireAuth,
	validateRequest(CreateWorkspaceSchema),
	workspaceController.createWorkspace,
);

// GET /api/v1/workspaces/:id  (members)
workspaceRegistry.registerPath({
	method: "get",
	path: "/api/v1/workspaces/{id}",
	tags: ["Workspace"],
	request: { params: IdParamSchema },
	responses: createApiResponse(WorkspaceSchema, "Success"),
});
workspaceRouter.get("/:id", requireAuth, validateRequest(GetWorkspaceSchema), workspaceController.getWorkspaceById);

// PATCH /api/v1/workspaces/:id  (owner/admin)
workspaceRegistry.registerPath({
	method: "patch",
	path: "/api/v1/workspaces/{id}",
	tags: ["Workspace"],
	request: { params: IdParamSchema, body: jsonBody(UpdateWorkspaceBodySchema) },
	responses: createApiResponse(WorkspaceSchema, "Success"),
});
workspaceRouter.patch("/:id", requireAuth, validateRequest(UpdateWorkspaceSchema), workspaceController.updateWorkspace);

// DELETE /api/v1/workspaces/:id  (owner only; soft delete)
workspaceRegistry.registerPath({
	method: "delete",
	path: "/api/v1/workspaces/{id}",
	tags: ["Workspace"],
	request: { params: IdParamSchema },
	responses: createApiResponse(z.null(), "Success"),
});
workspaceRouter.delete(
	"/:id",
	requireAuth,
	validateRequest(DeleteWorkspaceSchema),
	workspaceController.deleteWorkspace,
);
