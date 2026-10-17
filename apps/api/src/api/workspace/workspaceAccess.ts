import { trusted } from "mongoose";
import { type Role, Workspace, workspaceRoleOf } from "@/db/schema";

// Internal helpers (routes live in workspaceRouter.ts): every user gets one personal workspace, created on first use, and forms live in it.

/** workspaceId -> the user's role there, for every workspace the user is a member of. */
export async function membershipsOf(userId: string): Promise<Map<string, Role>> {
	const workspaces = await Workspace.find({ "members.user": userId }).select("members").lean();
	const roles = new Map<string, Role>();
	for (const w of workspaces) {
		const role = workspaceRoleOf(w as unknown as { members: { user: string; role: Role }[] }, userId);
		if (role) roles.set(String(w._id), role);
	}
	return roles;
}

const ownedBy = (userId: string) => ({ members: trusted({ $elemMatch: { user: userId, role: "owner" } }) });

export const DEFAULT_WORKSPACE_NAME = "Default workspace";

/** One per user: the unique slug index stops a double-create race. */
export const personalSlug = (userId: string) => `ws-${userId.toLowerCase()}`.slice(0, 48);

/** The workspace new forms go into. Created on sign-up (auth hook); also lazily here for users made before that hook. */
export async function ensurePersonalWorkspace(user: { id: string }): Promise<string> {
	const owned = await Workspace.findOne(ownedBy(user.id)).select("_id");
	if (owned) return String(owned._id);

	try {
		const created = await Workspace.create({
			name: DEFAULT_WORKSPACE_NAME,
			slug: personalSlug(user.id),
			members: [{ user: user.id, role: "owner" }],
		});
		return String(created._id);
	} catch (ex) {
		if ((ex as { code?: number }).code !== 11000) throw ex;
		const raced = await Workspace.findOne(ownedBy(user.id)).select("_id");
		if (!raced) throw ex;
		return String(raced._id);
	}
}
