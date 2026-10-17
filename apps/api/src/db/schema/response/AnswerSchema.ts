import { Schema } from "mongoose";
import { FIELD_TYPES } from "../constants";

// One answer per field. Typed slots keep answers queryable/indexable instead of a single Mixed blob.
export const AnswerSchema = new Schema(
	{
		fieldKey: { type: String, required: true },
		fieldType: { type: String, enum: FIELD_TYPES, required: true },
		text: { type: String, maxlength: 20000 },
		number: Number,
		boolean: Boolean,
		date: Date,
		choices: { type: [String], default: undefined }, // option keys
		otherText: { type: String, maxlength: 1000 },
		files: { type: [{ type: Schema.Types.ObjectId, ref: "FileAsset" }], default: undefined },
		skipped: { type: Boolean, default: false },
	},
	{ _id: false },
);
