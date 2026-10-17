import type { Request, RequestHandler, Response } from "express";
import { FormService } from "@/api/form/formService";
import type { IUser } from "@/types";

// Handlers run behind `requireAuth` (req.user is set) and `validateRequest` (req.body is the parsed body).
class FormController {
	private formService: FormService;

	constructor(formService: FormService = new FormService()) {
		this.formService = formService;
	}

	public createForm: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.createForm(req.user as IUser, req.body);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getForms: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.getFormsByUserId((req.user as IUser).id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getFormById: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.getformById(req.params.id as string, (req.user as IUser).id);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public getFormBySlug: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.getformBySlug(req.params.slug as string);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateFormFields: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.updateFormFields(
			req.params.id as string,
			(req.user as IUser).id,
			req.body.fields,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateBasicInformation: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.updateBasicInformation(
			req.params.id as string,
			(req.user as IUser).id,
			req.body,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};

	public updateFormPublishStatus: RequestHandler = async (req: Request, res: Response) => {
		const serviceResponse = await this.formService.updateFormPublishStatus(
			req.params.id as string,
			(req.user as IUser).id,
			req.body.publish,
		);
		res.status(serviceResponse.statusCode).send(serviceResponse);
	};
}

export const formController = new FormController();
