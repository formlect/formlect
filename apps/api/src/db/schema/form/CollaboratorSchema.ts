import { Schema } from "mongoose";
import { FORM_ROLES } from "../constants";

export const CollaboratorSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		role: { type: String, enum: FORM_ROLES, required: true },
		addedBy: { type: Schema.Types.ObjectId, ref: "User" },
		addedAt: { type: Date, default: Date.now },
	},
	{ _id: false },
);
