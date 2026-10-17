import type { Request, RequestHandler, Response } from "express";
import type { IUser } from "@/types";
import { OnboardingService } from "./onboardingService";

class OnboardingController {
	private onboardingService: OnboardingService;
	constructor(onboardingService: OnboardingService = new OnboardingService()) {
		this.onboardingService = onboardingService;
	}

	public complete: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.onboardingService.complete((req.user as IUser).id, req.body.workspaceName);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const onboardingController = new OnboardingController();
