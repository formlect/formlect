import { StatusCodes } from "http-status-codes";
import { auth } from "@/api/auth";
import { ensurePersonalWorkspace } from "@/api/workspace/workspaceAccess";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { toServiceFailure } from "@/common/utils/mongoErrors";
import { Workspace } from "@/db/schema";

export class OnboardingService {
	/** Renames the user's default workspace and marks them onboarded. Safe to repeat. */
	async complete(userId: string, workspaceName: string) {
		try {
			const id = await ensurePersonalWorkspace({ id: userId });
			const workspace = await Workspace.findById(id);
			if (!workspace) return ServiceResponse.failure("Workspace not found", null, StatusCodes.NOT_FOUND);
			workspace.set("name", workspaceName);
			await workspace.save();

			// Better Auth owns the user document, so write through its adapter (isOnboarded is input: false)
			const ctx = await (await auth()).$context;
			await ctx.internalAdapter.updateUser(userId, { isOnboarded: true });

			return ServiceResponse.success("Onboarding complete", { workspace: { id, name: workspace.name } });
		} catch (ex) {
			return toServiceFailure(ex, "completing onboarding");
		}
	}
}
