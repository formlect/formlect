import { Schema } from "mongoose";
import { FONT_PAIRS, FORM_LAYOUTS, THEME_PRESETS } from "../constants";
import { hex } from "./shared";

// Mirrors the Design tab. Applies to the plain form AND the form card on the landing page.
export const DesignSchema = new Schema(
	{
		preset: { type: String, enum: THEME_PRESETS, default: "formlect" },
		accent: { ...hex, default: null }, // null = preset's accent
		font: { type: String, enum: FONT_PAIRS, default: "modern" },
		layout: { type: String, enum: FORM_LAYOUTS, default: "classic" },
		corners: { type: String, enum: ["sharp", "soft", "round"], default: "soft" },
		cover: {
			type: { type: String, enum: ["none", "color", "image"], default: "none" },
			image: { type: Schema.Types.ObjectId, ref: "FileAsset" },
		},
		button: {
			style: { type: String, enum: ["filled", "outline"], default: "filled" },
			label: { type: String, trim: true, default: "Submit", maxlength: 40 },
		},
		showProgress: { type: Boolean, default: true },
		customCss: { type: String, maxlength: 20000 },
	},
	{ _id: false },
);

DesignSchema.path("cover.image").validate(function (this: { cover?: { type?: string } | null }, v: unknown) {
	return this.cover?.type !== "image" || !!v;
}, "Image cover needs an image");
