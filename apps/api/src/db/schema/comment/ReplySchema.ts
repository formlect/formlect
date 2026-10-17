import { Schema } from "mongoose";

export const ReplySchema = new Schema(
	{
		author: { type: Schema.Types.ObjectId, ref: "User", required: true },
		body: { type: String, required: true, maxlength: 5000 },
		mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
		editedAt: Date,
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);
