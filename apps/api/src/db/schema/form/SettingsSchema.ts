import { Schema } from "mongoose";

export const SettingsSchema = new Schema(
	{
		acceptingResponses: { type: Boolean, default: true },
		opensAt: Date,
		closesAt: Date,
		responseLimit: { type: Number, min: 1 },
		oneResponsePerUser: { type: Boolean, default: false },
		requireLogin: { type: Boolean, default: false },
		allowEditAfterSubmit: { type: Boolean, default: false },
		saveProgress: { type: Boolean, default: true },
		captcha: { type: Boolean, default: false },
		collectIp: { type: Boolean, default: false },
		closedMessage: { type: String, maxlength: 1000 },
		thankYou: {
			heading: { type: String, default: "Thanks!", maxlength: 200 },
			message: { type: String, maxlength: 2000 },
			redirectUrl: String,
		},
		notifications: {
			emailOnResponse: [{ type: String, lowercase: true, trim: true }],
			respondentReceipt: { type: Boolean, default: false },
		},
		webhooks: [
			{
				_id: false,
				url: { type: String, required: true },
				secret: { type: String, select: false },
				events: [{ type: String, enum: ["response.created", "response.updated", "form.published"] }],
				enabled: { type: Boolean, default: true },
			},
		],
	},
	{ _id: false },
);
