import { model, Schema } from "mongoose";
import { softDeletePlugin, toJSONPlugin } from "../plugins";
import { ReplySchema } from "./ReplySchema";

// Pinned comment threads on fields, page sections, or the form itself
const CommentSchema = new Schema(
	{
		form: { type: Schema.Types.ObjectId, ref: "Form", required: true },
		workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
		anchor: {
			scope: { type: String, enum: ["form", "field", "logic", "design", "page_section"], required: true },
			targetKey: String, // field key / rule key / section key
			x: { type: Number, min: 0, max: 1 }, // relative pin position
			y: { type: Number, min: 0, max: 1 },
		},
		author: { type: Schema.Types.ObjectId, ref: "User", required: true },
		body: { type: String, required: true, maxlength: 5000 },
		mentions: [{ type: Schema.Types.ObjectId, ref: "User" }],
		replies: [ReplySchema],
		resolvedAt: Date,
		resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
		formRevision: Number,
	},
	{ timestamps: true },
);

CommentSchema.index({ form: 1, resolvedAt: 1, createdAt: -1 });
CommentSchema.index({ form: 1, "anchor.scope": 1, "anchor.targetKey": 1 });
CommentSchema.index({ mentions: 1, createdAt: -1 });
CommentSchema.index({ "replies.mentions": 1 });

CommentSchema.virtual("resolved").get(function (this: { resolvedAt?: Date }) {
	return !!this.resolvedAt;
});

CommentSchema.plugin(softDeletePlugin);
CommentSchema.plugin(toJSONPlugin);

const Comment = model("Comment", CommentSchema);
export default Comment;
