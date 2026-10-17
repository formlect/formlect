import { Schema } from "mongoose";
import { BACKGROUND_TEXTURES, BACKGROUND_TYPES, FORM_CARD_STYLES, PAGE_LAYOUTS, PAGE_SECTIONS } from "../constants";
import { hex, key } from "./shared";

const BackgroundSchema = new Schema(
	{
		type: { type: String, enum: BACKGROUND_TYPES, default: "color" },
		color: { ...hex, default: "#1D5C45" },
		texture: { type: String, enum: BACKGROUND_TEXTURES, default: "none" }, // color only
		media: { type: Schema.Types.ObjectId, ref: "FileAsset" }, // image / video
		poster: { type: Schema.Types.ObjectId, ref: "FileAsset" }, // video still
		tint: { type: Number, min: 0, max: 80, default: 45 }, // darken overlay %, image/video
		blur: { type: Number, min: 0, max: 40, default: 0 },
	},
	{ _id: false },
);

BackgroundSchema.path("media").validate(function (this: { type?: string }, v: unknown) {
	return this.type === "color" || !!v;
}, "Image and video backgrounds need media");

const FaqItemSchema = new Schema(
	{
		key,
		q: { type: String, required: true, trim: true, maxlength: 300 },
		a: { type: String, required: true, maxlength: 3000 },
	},
	{ _id: false },
);

type Section = { type: string; enabled: boolean };

// Design tab -> "Turn this into a page". Off: form on a clean page. On: form inside this page.
// Embeds always render the form only, regardless of `enabled`.
export const LandingPageSchema = new Schema(
	{
		enabled: { type: Boolean, default: false },
		enabledAt: Date,
		enabledBy: { type: Schema.Types.ObjectId, ref: "User" },
		layout: { type: String, enum: PAGE_LAYOUTS, default: "cover" },

		background: { type: BackgroundSchema, default: () => ({}) },
		mobileBackground: { type: BackgroundSchema, default: undefined }, // optional override; falls back to background
		accent: { ...hex, default: "#1D5C45" },
		formCard: { type: String, enum: FORM_CARD_STYLES, default: "solid" }, // glass only applies when the card sits on the background

		// Section visibility + order (the form section is always present)
		sections: {
			type: [
				{
					_id: false,
					type: { type: String, enum: PAGE_SECTIONS, required: true },
					enabled: { type: Boolean, default: true },
				},
			],
			default: () => PAGE_SECTIONS.map((type) => ({ type, enabled: true })),
			validate: {
				validator: (s: Section[]) =>
					new Set(s.map((x) => x.type)).size === s.length && s.some((x) => x.type === "form" && x.enabled),
				message: "Sections must be unique and include the form",
			},
		},

		content: {
			orgName: { type: String, trim: true, maxlength: 120 },
			logo: { type: Schema.Types.ObjectId, ref: "FileAsset" },
			eyebrow: { type: String, maxlength: 60 }, // e.g. "COMMUNITY SURVEY · 2026"
			headline: { type: String, maxlength: 200 },
			intro: { type: String, maxlength: 1000 },
			about: { type: String, maxlength: 2000 },
			why: { type: String, maxlength: 2000 }, // "How we use data"
			deadline: Date, // falls back to settings.closesAt
			showResponseCount: { type: Boolean, default: true },
			faq: { type: [FaqItemSchema], validate: (v: unknown[]) => v.length <= 30 },
			footerLinks: [{ _id: false, label: { type: String, maxlength: 60 }, href: { type: String, maxlength: 2048 } }],
		},

		seo: {
			title: { type: String, maxlength: 70 },
			description: { type: String, maxlength: 160 },
			ogImageUrl: String,
			noIndex: { type: Boolean, default: false },
		},
	},
	{ _id: false },
);
