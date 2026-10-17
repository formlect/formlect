import type { Request, RequestHandler, Response } from "express";
import type { IUser } from "@/types";
import { FormResponseService } from "./formResponseService";

class FormResponseController {
	private formResponseService: FormResponseService;
	constructor(formResponseService: FormResponseService = new FormResponseService()) {
		this.formResponseService = formResponseService;
	}

	public createFormResponse: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formResponseService.createFormResponse(
			req.user as IUser,
			req.get("user-agent"),
			req.body,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const formResponseController = new FormResponseController();
