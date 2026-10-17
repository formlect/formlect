import { beforeEach, describe, expect, it, vi } from "vitest";

// No DB: Workspace.findOne(...).select(...) resolves to whatever `found` holds.
let found: {
	slug: string;
	members: { user: string; role: string }[];
	set: ReturnType<typeof vi.fn>;
	save: ReturnType<typeof vi.fn>;
	toJSON: () => object;
} | null;
vi.mock("@/db/schema", async () => {
	const { workspaceRoleOf } = await import("@/db/schema/workspace/workspaceHelpers");
	return { Workspace: { findOne: () => ({ select: async () => found }) }, workspaceRoleOf };
});
vi.mock("@/common/utils/mongoErrors", () => ({
	toServiceFailure: (ex: unknown) => {
		throw ex;
	},
}));

const { WorkspaceService } = await import("../workspaceService");
const service = new WorkspaceService();
const ID = "a".repeat(24);

const workspace = (role: string, slug = "team-1234") => ({
	slug,
	members: [{ user: "u1", role }],
	set: vi.fn(),
	save: vi.fn(),
	toJSON: () => ({ slug }),
});

describe("WorkspaceService access", () => {
	beforeEach(() => {
		found = null;
	});

	it("404s a non-member", async () => {
		expect((await service.getWorkspaceById(ID, "u1")).statusCode).toBe(404);
		expect((await service.deleteWorkspace(ID, "u1")).statusCode).toBe(404);
	});

	it("lets any member read, with their role", async () => {
		found = workspace("viewer");
		const r = await service.getWorkspaceById(ID, "u1");
		expect(r.statusCode).toBe(200);
		expect(r.responseObject?.role).toBe("viewer");
	});

	it("only owner/admin can update", async () => {
		found = workspace("editor");
		expect((await service.updateWorkspace(ID, "u1", { name: "x" })).statusCode).toBe(403);
		found = workspace("admin");
		expect((await service.updateWorkspace(ID, "u1", { name: "x" })).statusCode).toBe(200);
		expect(found.save).toHaveBeenCalled();
	});

	it("only the owner can delete", async () => {
		found = workspace("admin");
		expect((await service.deleteWorkspace(ID, "u1")).statusCode).toBe(403);
		expect(found.save).not.toHaveBeenCalled();
		found = workspace("owner");
		expect((await service.deleteWorkspace(ID, "u1")).statusCode).toBe(200);
		expect(found.set).toHaveBeenCalledWith("deletedAt", expect.any(Date));
	});

	it("refuses to delete the personal workspace", async () => {
		found = workspace("owner", "ws-u1");
		expect((await service.deleteWorkspace(ID, "u1")).statusCode).toBe(409);
		expect(found.save).not.toHaveBeenCalled();
	});
});
