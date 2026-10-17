import { Schema } from "mongoose";
import { LOGIC_ACTIONS, LOGIC_OPERATORS } from "../constants";
import { key } from "./shared";

const ConditionSchema = new Schema(
	{
		join: { type: String, enum: ["and", "or"], default: "and" }, // join with previous condition
		fieldKey: { type: String, required: true },
		operator: { type: String, enum: LOGIC_OPERATORS, required: true },
		value: Schema.Types.Mixed,
	},
	{ _id: false },
);

const ActionSchema = new Schema(
	{
		type: { type: String, enum: LOGIC_ACTIONS, required: true },
		targetKey: String, // field key, page key, or variable name
		value: Schema.Types.Mixed,
	},
	{ _id: false },
);

export const LogicRuleSchema = new Schema(
	{
		key,
		name: { type: String, maxlength: 120 },
		enabled: { type: Boolean, default: true },
		conditions: { type: [ConditionSchema], validate: (v: unknown[]) => v.length > 0 },
		actions: { type: [ActionSchema], validate: (v: unknown[]) => v.length > 0 },
	},
	{ _id: false },
);
