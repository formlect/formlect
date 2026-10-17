import type { Role } from "../constants";

type Id = { toString(): string } | string;

export function workspaceRoleOf(workspace: { members: { user: Id; role: Role }[] }, userId: Id): Role | null {
	return workspace.members.find((m) => String(m.user) === String(userId))?.role ?? null;
}
