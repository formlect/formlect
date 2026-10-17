import { model, Schema } from "mongoose";
import { FORM_STATUS } from "../constants";
import { softDeletePlugin, toJSONPlugin } from "../plugins";
import { CollaboratorSchema } from "./CollaboratorSchema";
import { DesignSchema } from "./DesignSchema";
import { FieldSchema } from "./FieldSchema";
import { LandingPageSchema } from "./LandingPageSchema";
import { LogicRuleSchema } from "./LogicSchema";
import { SettingsSchema } from "./SettingsSchema";

type FieldLike = { key: string };
type RuleLike = { key: string; conditions: { fieldKey: string }[]; actions: { type: string; targetKey?: string }[] };

// The working draft (what the builder edits). Respondents see a FormVersion snapshot, never this document.
const FormSchema = new Schema(
	{
		workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
		createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		updatedBy: { type: Schema.Types.ObjectId, ref: "User" },

		title: { type: String, required: true, trim: true, maxlength: 200, default: "Untitled form" },
		description: { type: String, maxlength: 4000 },
		// slug: always server-generated, never edited. alias: optional vanity link the owner picks (lowercase).
		slug: { type: String, trim: true, match: /^[a-zA-Z0-9-]{8,10}$/ },
		alias: { type: String, trim: true, lowercase: true, match: /^[a-z0-9-]{3,40}$/ },
		status: { type: String, enum: FORM_STATUS, default: "draft", index: true },
		tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],

		fields: {
			type: [FieldSchema],
			validate: [
				{ validator: (f: unknown[]) => f.length <= 500, message: "Max 500 fields" },
				{
					validator: (f: FieldLike[]) => new Set(f.map((x) => x.key)).size === f.length,
					message: "Field keys must be unique",
				},
			],
		},
		logic: [LogicRuleSchema],
		variables: [
			{
				_id: false,
				name: { type: String, match: /^[a-zA-Z_]\w{0,40}$/ },
				type: { type: String, enum: ["number", "text"] },
				initial: Schema.Types.Mixed,
			},
		],
		design: { type: DesignSchema, default: () => ({}) },
		page: { type: LandingPageSchema, default: () => ({}) },
		settings: { type: SettingsSchema, default: () => ({}) },

		collaborators: [CollaboratorSchema],
		share: {
			visibility: { type: String, enum: ["public", "unlisted", "workspace", "password"], default: "public" },
			passwordHash: { type: String, select: false },
			embedAllowedOrigins: [String],
		},

		// Publishing
		publishedVersion: { type: Schema.Types.ObjectId, ref: "FormVersion" },
		publishedAt: Date,
		revision: { type: Number, default: 0 }, // bumped on every draft save; used for optimistic concurrency
		hasUnpublishedChanges: { type: Boolean, default: false },

		// Denormalised counters (updated atomically by the response service)
		stats: {
			views: { type: Number, default: 0 },
			starts: { type: Number, default: 0 },
			responses: { type: Number, default: 0 },
			lastResponseAt: Date,
		},

		aiDraft: { prompt: { type: String, maxlength: 2000 }, model: String, generatedAt: Date },
	},
	{ timestamps: true, optimisticConcurrency: true },
);

FormSchema.index({ workspace: 1, updatedAt: -1 });
FormSchema.index({ workspace: 1, status: 1 });
// Soft-deleted forms keep their slug and alias reserved.
FormSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: "string" } } });
FormSchema.index({ alias: 1 }, { unique: true, partialFilterExpression: { alias: { $type: "string" } } });
FormSchema.index({ "collaborators.user": 1 });
FormSchema.index({ title: "text", description: "text", tags: "text" });

// What the public link renders
FormSchema.virtual("renderMode").get(function (this: { page?: { enabled?: boolean } }) {
	return this.page?.enabled ? "page" : "form";
});

FormSchema.virtual("completionRate").get(function (this: { stats?: { starts?: number; responses?: number } }) {
	const { starts, responses } = this.stats ?? {};
	return starts ? +((responses ?? 0) / starts).toFixed(4) : 0;
});

// Keeps page settings when toggled off, so turning it back on restores them
FormSchema.methods.setPageEnabled = function (
	this: { page: { enabled: boolean; enabledAt?: Date; enabledBy?: unknown } },
	on: boolean,
	userId: unknown,
) {
	this.page.enabled = !!on;
	if (on) {
		this.page.enabledAt = new Date();
		this.page.enabledBy = userId;
	}
	return this;
};

// Logic must reference existing fields
FormSchema.pre("validate", function (this: { fields: FieldLike[]; logic: RuleLike[] }) {
	const keys = new Set(this.fields.map((f) => f.key));
	for (const r of this.logic) {
		for (const c of r.conditions)
			if (!keys.has(c.fieldKey)) throw new Error(`Rule ${r.key}: unknown field ${c.fieldKey}`);
		for (const a of r.actions) {
			if (["show", "hide", "require"].includes(a.type) && !(a.targetKey && keys.has(a.targetKey))) {
				throw new Error(`Rule ${r.key}: unknown target ${a.targetKey}`);
			}
		}
	}
});

const CONTENT_PATHS = ["fields", "logic", "design", "page", "settings", "variables", "title", "description"];

FormSchema.pre(
	"save",
	function (this: {
		isNew: boolean;
		isModified: (p: string) => boolean;
		revision: number;
		status: string;
		hasUnpublishedChanges: boolean;
	}) {
		if (!this.isNew && CONTENT_PATHS.some((p) => this.isModified(p))) {
			this.revision += 1;
			if (this.status === "published") this.hasUnpublishedChanges = true;
		}
	},
);

FormSchema.plugin(softDeletePlugin);
FormSchema.plugin(toJSONPlugin, { hide: ["share.passwordHash"] });

export { FormSchema };
const Form = model("Form", FormSchema);
export default Form;
