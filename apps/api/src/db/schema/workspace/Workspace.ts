import { model, Schema } from "mongoose";
import { ROLES } from "../constants";
import { softDeletePlugin, toJSONPlugin } from "../plugins";

const MemberSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: "User", required: true },
		role: { type: String, enum: ROLES, default: "editor" },
		invitedBy: { type: Schema.Types.ObjectId, ref: "User" },
		joinedAt: { type: Date, default: Date.now },
	},
	{ _id: false },
);

const InviteSchema = new Schema(
	{
		email: { type: String, required: true, lowercase: true, trim: true },
		role: { type: String, enum: ROLES.filter((r) => r !== "owner"), default: "editor" },
		tokenHash: { type: String, required: true, select: false },
		invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
		expiresAt: { type: Date, required: true },
		acceptedAt: Date,
	},
	{ timestamps: true },
);

// The tenant: forms, responses and files belong to a workspace, and members + roles decide who can touch them.
const WorkspaceSchema = new Schema(
	{
		name: { type: String, required: true, trim: true, maxlength: 80 },
		slug: { type: String, required: true, lowercase: true, trim: true, match: /^[a-z0-9-]{2,48}$/ },
		logoUrl: String,
		members: {
			type: [MemberSchema],
			validate: {
				validator: (m: { role: string }[]) => m.some((x) => x.role === "owner"),
				message: "Workspace needs an owner",
			},
		},
		invites: [InviteSchema],
		brand: {
			primaryColor: { type: String, default: "#4B2BD1", match: /^#[0-9a-f]{6}$/i },
			accentColor: { type: String, default: "#FFB38F", match: /^#[0-9a-f]{6}$/i },
			fontFamily: { type: String, default: "Inter" },
			customDomain: { type: String, lowercase: true, trim: true },
		},
		limits: {
			maxForms: { type: Number, default: null },
			maxResponsesPerMonth: { type: Number, default: null },
			maxStorageBytes: { type: Number, default: null },
		},
		usage: {
			storageBytes: { type: Number, default: 0, min: 0 },
			responsesThisPeriod: { type: Number, default: 0, min: 0 },
			periodStart: { type: Date, default: Date.now },
		},
	},
	{ timestamps: true },
);

// Soft-deleted workspaces keep their slug reserved.
WorkspaceSchema.index({ slug: 1 }, { unique: true });
WorkspaceSchema.index({ "members.user": 1 });
WorkspaceSchema.index({ "brand.customDomain": 1 }, { unique: true, sparse: true });

WorkspaceSchema.plugin(softDeletePlugin);
WorkspaceSchema.plugin(toJSONPlugin);

const Workspace = model("Workspace", WorkspaceSchema);
export default Workspace;
