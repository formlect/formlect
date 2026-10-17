import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { commonValidations } from "@/common/utils/commonValidation";
import { ROLES } from "@/db/schema/constants";

extendZodWithOpenApi(z);

// Caps mirror db/schema/workspace/Workspace.ts (keep them in sync).
const name = z.string().trim().min(1).max(80);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colour must be #rrggbb");
const httpsUrl = z
	.string()
	.url()
	.max(2048)
	.refine((s) => s.startsWith("https://"), "Must be an https URL");

export const WorkspaceSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	logoUrl: z.string().nullish(),
	members: z.array(z.object({ user: z.string(), role: z.enum(ROLES), joinedAt: z.date() })),
	brand: z.object({ primaryColor: z.string(), accentColor: z.string(), fontFamily: z.string() }).partial(),
	/** The caller's role in this workspace. */
	role: z.enum(ROLES),
	createdAt: z.date(),
	updatedAt: z.date(),
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const IdParamSchema = z.object({ id: commonValidations.id });

export const CreateWorkspaceBodySchema = z.object({ name });
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceBodySchema>;

export const UpdateWorkspaceBodySchema = z.object({
	name: name.optional(),
	logoUrl: httpsUrl.nullable().optional(),
	brand: z.object({ primaryColor: hex.optional(), accentColor: hex.optional() }).optional(),
});
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceBodySchema>;

export const GetWorkspaceSchema = z.object({ params: IdParamSchema });
export const CreateWorkspaceSchema = z.object({ body: CreateWorkspaceBodySchema });
export const UpdateWorkspaceSchema = z.object({ params: IdParamSchema, body: UpdateWorkspaceBodySchema });
export const DeleteWorkspaceSchema = z.object({ params: IdParamSchema });
