import { Schema } from "mongoose";
import {
	APPEARANCE_GROUPS,
	CHOICE_FIELD_TYPES,
	FIELD_APPEARANCE_GROUP,
	FIELD_TYPES,
	type FieldType,
} from "../constants";
import { key } from "./shared";

const OptionSchema = new Schema(
	{
		key,
		label: { type: String, required: true, trim: true, maxlength: 500 },
		imageUrl: String,
		isOther: { type: Boolean, default: false },
	},
	{ _id: false },
);

const ValidationSchema = new Schema(
	{
		minLength: { type: Number, min: 0 },
		maxLength: { type: Number, min: 1 },
		min: Number,
		max: Number,
		step: { type: Number, min: 0 },
		pattern: { type: String, maxlength: 500 },
		patternMessage: { type: String, maxlength: 200 },
		minSelections: { type: Number, min: 0 },
		maxSelections: { type: Number, min: 1 },
		minDate: Date,
		maxDate: Date,
		maxFiles: { type: Number, min: 1, max: 50 },
		maxFileSizeMB: { type: Number, min: 0.1, max: 1024 },
		acceptedMimeTypes: [{ type: String, maxlength: 120 }],
	},
	{ _id: false },
);

export const FieldSchema = new Schema(
	{
		key,
		type: { type: String, enum: FIELD_TYPES, required: true },
		name: { type: String, trim: true, maxlength: 64 }, // data key shown in exports (the builder's "data key")
		title: { type: String, trim: true, maxlength: 1000, default: "" },
		description: { type: String, maxlength: 4000 },
		placeholder: { type: String, maxlength: 200 },
		required: { type: Boolean, default: false },
		appearance: { type: String }, // validated against FIELD_APPEARANCE_GROUP below
		options: { type: [OptionSchema], default: undefined },
		randomizeOptions: { type: Boolean, default: false },
		scale: {
			max: { type: Number, enum: [3, 5, 7, 10] },
			minLabel: { type: String, maxlength: 60 },
			maxLabel: { type: String, maxlength: 60 },
		},
		validation: ValidationSchema,
		defaultValue: Schema.Types.Mixed,
		hidden: { type: Boolean, default: false },
		pageKey: { type: String }, // groups fields into steps for 'steps' / 'one_at_a_time'
	},
	{ _id: false },
);

FieldSchema.path("appearance").validate(function (this: { type: FieldType }, v: string | null | undefined) {
	if (v == null) return true;
	const group = FIELD_APPEARANCE_GROUP[this.type];
	return !!group && (APPEARANCE_GROUPS[group] as readonly string[]).includes(v);
}, 'Appearance "{VALUE}" is not valid for this field type');

FieldSchema.path("options").validate(function (this: { type: FieldType }, opts: { key: string }[] | undefined) {
	if (!CHOICE_FIELD_TYPES.includes(this.type)) return true;
	if (!opts || opts.length < 1) return false;
	return new Set(opts.map((o) => o.key)).size === opts.length;
}, "Choice fields need at least one option with unique keys");
