import type { Request, RequestHandler, Response } from "express";
import type { IUser } from "@/types";
import { WorkspaceService } from "./workspaceService";

// Handlers run behind `requireAuth` (req.user is set) and `validateRequest` (req.body is the parsed body).
class WorkspaceController {
	private workspaceService: WorkspaceService;

	constructor(workspaceService: WorkspaceService = new WorkspaceService()) {
		this.workspaceService = workspaceService;
	}

	public createWorkspace: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.workspaceService.createWorkspace((req.user as IUser).id, req.body);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getWorkspaces: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.workspaceService.getWorkspaces((req.user as IUser).id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getWorkspaceById: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.workspaceService.getWorkspaceById(
			req.params.id as string,
			(req.user as IUser).id,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateWorkspace: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.workspaceService.updateWorkspace(
			req.params.id as string,
			(req.user as IUser).id,
			req.body,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public deleteWorkspace: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.workspaceService.deleteWorkspace(
			req.params.id as string,
			(req.user as IUser).id,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const workspaceController = new WorkspaceController();
