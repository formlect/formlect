import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { toServiceFailure } from "@/common/utils/mongoErrors";
import { Form, FormVersion, isAcceptingResponses, Response } from "@/db/schema";
import type { CreateFormResponseInput } from "./formResponseModel";
import { checkAnswers, type SnapshotField } from "./formResponseValidation";

type Respondent = { id: string };

export class FormResponseService {
	// Submits a completed response to a PUBLISHED form. Everything that matters is decided here, not by the client:
	// the form version, the answer shape, attribution (session user) and the response number.
	async createFormResponse(user: Respondent, userAgent: string | undefined, data: CreateFormResponseInput) {
		try {
			const form = await Form.findOne({ _id: data.formId, status: "published" }).select(
				"workspace publishedVersion settings stats status",
			);
			if (!form?.publishedVersion) return ServiceResponse.failure<null>("Form not found", null, StatusCodes.NOT_FOUND);
			if (!isAcceptingResponses(form)) {
				return ServiceResponse.failure<null>(
					form.settings?.closedMessage || "This form is not accepting responses",
					null,
					StatusCodes.FORBIDDEN,
				);
			}

			if (form.settings?.oneResponsePerUser) {
				const already = await Response.exists({ form: form._id, "respondent.user": user.id, status: "completed" });
				if (already)
					return ServiceResponse.failure<null>("You have already responded to this form", null, StatusCodes.CONFLICT);
			}

			const version = await FormVersion.findById(form.publishedVersion).select("snapshot.fields").lean();
			if (!version) return ServiceResponse.failure<null>("Form not found", null, StatusCodes.NOT_FOUND);

			const { answers, errors } = checkAnswers(version.snapshot?.fields as unknown as SnapshotField[], data.answers);
			if (errors.length) {
				return ServiceResponse.failure<null>(
					`Invalid answers: ${errors.slice(0, 5).join("; ")}`,
					null,
					StatusCodes.BAD_REQUEST,
				);
			}

			// Atomic counter first: it gives the response a unique number. responseLimit is checked above, so concurrent
			// submissions can overshoot it by a few (ceiling; make the $inc conditional on the limit if that ever matters).
			const now = new Date();
			const counted = await Form.findOneAndUpdate(
				{ _id: form._id },
				{ $inc: { "stats.responses": 1 }, $set: { "stats.lastResponseAt": now } },
				{ new: true },
			);
			const number = counted?.stats?.responses as number;

			try {
				const response = await Response.create({
					form: form._id,
					workspace: form.workspace,
					formVersion: version._id,
					status: "completed",
					answers,
					hiddenFields: data.hiddenFields,
					respondent: { user: user.id },
					meta: { userAgent: userAgent?.slice(0, 512), source: "link" },
					timing: { startedAt: now },
					number,
				});
				return ServiceResponse.success("Response submitted", { id: String(response._id), number }, StatusCodes.CREATED);
			} catch (ex) {
				await Form.updateOne({ _id: form._id }, { $inc: { "stats.responses": -1 } }); // keep the counter honest if the insert failed
				throw ex;
			}
		} catch (ex) {
			return toServiceFailure(ex, "submitting the response");
		}
	}
}
