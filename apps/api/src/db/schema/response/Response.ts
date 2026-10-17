import { model, Schema } from "mongoose";
import { softDeletePlugin, toJSONPlugin } from "../plugins";
import { AnswerSchema } from "./AnswerSchema";

const ResponseSchema = new Schema(
	{
		form: { type: Schema.Types.ObjectId, ref: "Form", required: true },
		workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
		formVersion: { type: Schema.Types.ObjectId, ref: "FormVersion", required: true },

		status: { type: String, enum: ["partial", "completed", "spam"], default: "partial" },
		answers: [AnswerSchema],
		variables: { type: Map, of: Schema.Types.Mixed },
		hiddenFields: { type: Map, of: String }, // utm_source, ref, etc. from the URL

		respondent: {
			user: { type: Schema.Types.ObjectId, ref: "User" },
			email: { type: String, lowercase: true, trim: true },
			fingerprint: { type: String, maxlength: 128 }, // hashed; for one-response-per-user
		},
		meta: {
			ipHash: { type: String, select: false },
			userAgent: { type: String, maxlength: 512 },
			device: { type: String, enum: ["desktop", "mobile", "tablet", "unknown"], default: "unknown" },
			country: { type: String, maxlength: 2 },
			referrer: { type: String, maxlength: 2048 },
			source: { type: String, enum: ["link", "embed", "page", "api", "import"], default: "link" },
			locale: String,
		},
		timing: {
			startedAt: { type: Date, default: Date.now },
			submittedAt: Date,
			durationMs: { type: Number, min: 0 },
			lastFieldKey: String, // drop-off analytics for partials
		},
		resumeTokenHash: { type: String, select: false },
		editTokenHash: { type: String, select: false },

		review: {
			starred: { type: Boolean, default: false },
			tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
			note: { type: String, maxlength: 4000 },
			readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
		},
		number: { type: Number, min: 1 }, // sequential per form, assigned on completion
	},
	{ timestamps: true },
);

ResponseSchema.index({ form: 1, status: 1, "timing.submittedAt": -1 });
ResponseSchema.index(
	{ form: 1, number: 1 },
	{ unique: true, partialFilterExpression: { number: { $type: "number" } } },
);
ResponseSchema.index({ workspace: 1, createdAt: -1 }); // dashboard live feed
ResponseSchema.index({ form: 1, "answers.fieldKey": 1, "answers.choices": 1 }); // choice breakdowns
ResponseSchema.index({ form: 1, "respondent.fingerprint": 1 }, { sparse: true });
ResponseSchema.index({ form: 1, "respondent.user": 1 }, { sparse: true });
ResponseSchema.index({ form: 1, "review.tags": 1 });
// Abandoned partials expire after 30 days
ResponseSchema.index(
	{ updatedAt: 1 },
	{ expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { status: "partial" } },
);

// `timing.submittedAt/durationMs` are set when a response completes. The form's `stats.responses` counter and the
// response `number` are updated atomically by the response service, not by hooks.
ResponseSchema.pre(
	"save",
	function (this: {
		isModified: (p: string) => boolean;
		status: string;
		timing: { startedAt: Date; submittedAt?: Date; durationMs?: number };
	}) {
		if (this.isModified("status") && this.status === "completed" && !this.timing.submittedAt) {
			this.timing.submittedAt = new Date();
			this.timing.durationMs = this.timing.submittedAt.getTime() - this.timing.startedAt.getTime();
		}
	},
);

ResponseSchema.plugin(softDeletePlugin);
ResponseSchema.plugin(toJSONPlugin);

const Response = model("Response", ResponseSchema);
export default Response;
