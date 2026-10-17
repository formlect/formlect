import { randomBytes } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { toServiceFailure } from "@/common/utils/mongoErrors";
import { type Role, Workspace, workspaceRoleOf } from "@/db/schema";
import { personalSlug } from "./workspaceAccess";
import type { CreateWorkspaceInput, UpdateWorkspaceInput, Workspace as WorkspaceDto } from "./workspaceModel";

const EDIT_ROLES: Role[] = ["owner", "admin"];

// Invites hold emails and token hashes; they get their own endpoints when invites are built.
const FIELDS = "name slug logoUrl members brand createdAt updatedAt";

const notFound = () => ServiceResponse.failure<null>("Workspace not found", null, StatusCodes.NOT_FOUND);
const forbidden = (action: string) =>
	ServiceResponse.failure<null>(`You don't have permission to ${action} this workspace`, null, StatusCodes.FORBIDDEN);

const makeSlug = (name: string) =>
	`${
		name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 38) || "workspace"
	}-${randomBytes(4).toString("hex")}`;

type Members = { members: { user: string; role: Role }[] };

const toDto = (doc: { toJSON(): unknown }, role: Role) => ({ ...(doc.toJSON() as object), role }) as WorkspaceDto;

// Membership is part of the query, so a non-member gets the same 404 as a missing workspace.
async function findForMember(workspaceId: string, userId: string) {
	const workspace = await Workspace.findOne({ _id: workspaceId, "members.user": userId }).select(FIELDS);
	if (!workspace) return null;
	const role = workspaceRoleOf(workspace as unknown as Members, userId);
	return role ? { workspace, role } : null;
}

export class WorkspaceService {
	async createWorkspace(userId: string, data: CreateWorkspaceInput) {
		try {
			const workspace = await Workspace.create({
				name: data.name,
				slug: makeSlug(data.name),
				members: [{ user: userId, role: "owner" }],
			});
			return ServiceResponse.success<WorkspaceDto>(
				"Workspace created successfully",
				toDto(workspace, "owner"),
				StatusCodes.CREATED,
			);
		} catch (ex) {
			return toServiceFailure(ex, "creating the workspace");
		}
	}

	async getWorkspaces(userId: string) {
		try {
			const workspaces = await Workspace.find({ "members.user": userId }).select(FIELDS).sort({ createdAt: 1 });
			const dtos = workspaces.map((w) => toDto(w, workspaceRoleOf(w as unknown as Members, userId) as Role));
			return ServiceResponse.success("Workspaces fetched successfully", { workspaces: dtos, total: dtos.length });
		} catch (ex) {
			return toServiceFailure(ex, "fetching workspaces");
		}
	}

	async getWorkspaceById(workspaceId: string, userId: string) {
		try {
			const found = await findForMember(workspaceId, userId);
			if (!found) return notFound();
			return ServiceResponse.success<WorkspaceDto>(
				"Workspace fetched successfully",
				toDto(found.workspace, found.role),
			);
		} catch (ex) {
			return toServiceFailure(ex, "fetching the workspace");
		}
	}

	async updateWorkspace(workspaceId: string, userId: string, data: UpdateWorkspaceInput) {
		try {
			const found = await findForMember(workspaceId, userId);
			if (!found) return notFound();
			if (!EDIT_ROLES.includes(found.role)) return forbidden("edit");
			const { workspace } = found;

			if (data.name !== undefined) workspace.set("name", data.name);
			if (data.logoUrl !== undefined) workspace.set("logoUrl", data.logoUrl ?? undefined);
			if (data.brand?.primaryColor) workspace.set("brand.primaryColor", data.brand.primaryColor);
			if (data.brand?.accentColor) workspace.set("brand.accentColor", data.brand.accentColor);
			await workspace.save();

			return ServiceResponse.success<WorkspaceDto>("Workspace updated successfully", toDto(workspace, found.role));
		} catch (ex) {
			return toServiceFailure(ex, "updating the workspace");
		}
	}

	// Soft delete: its forms stay in the database but drop out of every member's access (membershipsOf skips deleted).
	async deleteWorkspace(workspaceId: string, userId: string) {
		try {
			const found = await findForMember(workspaceId, userId);
			if (!found) return notFound();
			if (found.role !== "owner") return forbidden("delete");
			const { workspace } = found;
			// New forms go into the personal workspace, and its slug stays reserved after a soft delete, so it can't be recreated.
			if (workspace.slug === personalSlug(userId))
				return ServiceResponse.failure("Your personal workspace can't be deleted", null, StatusCodes.CONFLICT);

			workspace.set("deletedAt", new Date());
			await workspace.save();
			return ServiceResponse.success("Workspace deleted successfully", null);
		} catch (ex) {
			return toServiceFailure(ex, "deleting the workspace");
		}
	}
}
