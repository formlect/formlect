import { model, Schema } from "mongoose";
import { toJSONPlugin } from "../plugins";
import { DesignSchema } from "./DesignSchema";
import { FieldSchema } from "./FieldSchema";
import { LandingPageSchema } from "./LandingPageSchema";
import { LogicRuleSchema } from "./LogicSchema";
import { SettingsSchema } from "./SettingsSchema";

// Immutable snapshot. Published versions are what respondents see;
// autosave snapshots power the builder's version history.
const FormVersionSchema = new Schema(
	{
		form: { type: Schema.Types.ObjectId, ref: "Form", required: true },
		workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
		number: { type: Number, required: true, min: 1 },
		kind: { type: String, enum: ["autosave", "named", "published", "restored"], default: "autosave" },
		label: { type: String, maxlength: 120 },
		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		contributors: [{ type: Schema.Types.ObjectId, ref: "User" }],
		fromRevision: { type: Number, required: true },
		snapshot: {
			title: String,
			description: String,
			fields: [FieldSchema],
			logic: [LogicRuleSchema],
			variables: [Schema.Types.Mixed],
			design: DesignSchema,
			page: LandingPageSchema,
			settings: SettingsSchema,
		},
		changeSummary: [
			{ _id: false, op: { type: String, enum: ["add", "remove", "update", "move"] }, path: String, fieldKey: String },
		],
	},
	{ timestamps: { createdAt: true, updatedAt: false } },
);

FormVersionSchema.index({ form: 1, number: -1 }, { unique: true });
FormVersionSchema.index({ form: 1, kind: 1, createdAt: -1 });
// Autosaves expire after 90 days; named/published are kept
FormVersionSchema.index(
	{ createdAt: 1 },
	{ expireAfterSeconds: 60 * 60 * 24 * 90, partialFilterExpression: { kind: "autosave" } },
);

const immutable = () => {
	throw new Error("FormVersion is immutable");
};
FormVersionSchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "replaceOne"], immutable);
FormVersionSchema.pre("save", function (this: { isNew: boolean }) {
	if (!this.isNew) immutable();
});

FormVersionSchema.plugin(toJSONPlugin);

const FormVersion = model("FormVersion", FormVersionSchema);
export default FormVersion;
