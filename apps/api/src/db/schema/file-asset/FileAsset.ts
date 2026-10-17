import { model, Schema } from "mongoose";
import { softDeletePlugin, toJSONPlugin } from "../plugins";

// Upload lifecycle: pending -> scanning -> ready/rejected. No upload endpoint exists yet (security checklist §9).
const FileAssetSchema = new Schema(
	{
		workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
		form: { type: Schema.Types.ObjectId, ref: "Form" },
		response: { type: Schema.Types.ObjectId, ref: "Response" },
		fieldKey: String,
		purpose: { type: String, enum: ["response_upload", "form_media", "page_media", "avatar", "logo"], required: true },
		uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },

		storage: {
			provider: { type: String, enum: ["s3", "gcs", "r2", "local"], required: true },
			bucket: String,
			key: { type: String, required: true },
		},
		originalName: { type: String, required: true, maxlength: 255 },
		mimeType: { type: String, required: true, maxlength: 120 },
		sizeBytes: { type: Number, required: true, min: 0 },
		checksum: { type: String, maxlength: 128 }, // sha256
		width: Number,
		height: Number,
		durationSec: Number,
		thumbnailKey: String,

		status: {
			type: String,
			enum: ["pending", "uploaded", "scanning", "ready", "rejected", "failed"],
			default: "pending",
		},
		error: { code: String, message: String },
		scan: { engine: String, result: { type: String, enum: ["clean", "infected", "error"] }, scannedAt: Date },
	},
	{ timestamps: true },
);

FileAssetSchema.index({ workspace: 1, createdAt: -1 });
FileAssetSchema.index({ response: 1 });
FileAssetSchema.index({ "storage.provider": 1, "storage.bucket": 1, "storage.key": 1 }, { unique: true });
// Uploads never attached to a response are cleaned up after 24h
FileAssetSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400, partialFilterExpression: { status: "pending" } });

FileAssetSchema.virtual("kind").get(function (this: { mimeType?: string }) {
	const m = this.mimeType || "";
	if (m.startsWith("image/")) return "image";
	if (m.startsWith("video/")) return "video";
	if (m.startsWith("audio/")) return "audio";
	if (m === "application/pdf") return "pdf";
	if (/sheet|excel|csv/.test(m)) return "spreadsheet";
	if (/word|document|text\//.test(m)) return "document";
	if (/zip|compressed|tar/.test(m)) return "archive";
	return "other";
});

FileAssetSchema.plugin(softDeletePlugin);
FileAssetSchema.plugin(toJSONPlugin, { hide: ["storage"] });

const FileAsset = model("FileAsset", FileAssetSchema);
export default FileAsset;
