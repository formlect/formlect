// Single source of truth for every enum used by the Mongoose schemas AND the zod request models (api/*/**Model.ts).

export const FIELD_TYPES = [
	"short_text",
	"long_text",
	"email",
	"phone",
	"url",
	"number",
	"single_choice",
	"multiple_choice",
	"dropdown",
	"yes_no",
	"rating",
	"opinion_scale",
	"nps",
	"range",
	"date",
	"time",
	"file_upload",
	"statement",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

// 7 appearance groups shared by the 18 field types
export const APPEARANCE_GROUPS = {
	text: ["underline", "boxed", "filled"],
	choice: ["list", "cards", "pills", "grid"],
	rating: ["stars", "hearts", "numbers", "emoji"],
	range: ["slider", "segments"],
	number: ["input", "stepper"],
	date: ["picker", "segmented", "calendar"],
	file: ["dropzone", "compact"],
} as const;
export type AppearanceGroup = keyof typeof APPEARANCE_GROUPS;

export const FIELD_APPEARANCE_GROUP: Record<FieldType, AppearanceGroup | null> = {
	short_text: "text",
	long_text: "text",
	email: "text",
	phone: "text",
	url: "text",
	number: "number",
	single_choice: "choice",
	multiple_choice: "choice",
	dropdown: "choice",
	yes_no: "choice",
	rating: "rating",
	opinion_scale: "rating",
	nps: "rating",
	range: "range",
	date: "date",
	time: "date",
	file_upload: "file",
	statement: null,
};

/** Field types whose value is picked from `options`. */
export const CHOICE_FIELD_TYPES: readonly FieldType[] = ["single_choice", "multiple_choice", "dropdown"];

export const FORM_LAYOUTS = ["classic", "one_at_a_time", "steps", "split", "cards", "chat"] as const;
export const THEME_PRESETS = ["formlect", "paper", "forest", "peach", "night", "mono"] as const;
export const FONT_PAIRS = ["modern", "editorial", "friendly", "system"] as const; // Sora+Manrope, DM Serif+Plex, Bricolage, system-ui
export const FORM_STATUS = ["draft", "published", "closed", "archived"] as const;
export type FormStatus = (typeof FORM_STATUS)[number];

export const ROLES = ["owner", "admin", "editor", "commenter", "viewer"] as const;
export type Role = (typeof ROLES)[number];
export const FORM_ROLES = ["editor", "commenter", "viewer"] as const;
export type FormRole = (typeof FORM_ROLES)[number];

export const LOGIC_OPERATORS = [
	"is",
	"is_not",
	"contains",
	"not_contains",
	"starts_with",
	"ends_with",
	"gt",
	"gte",
	"lt",
	"lte",
	"between",
	"is_empty",
	"is_not_empty",
	"includes_any",
	"includes_all",
	"before",
	"after",
	"on",
] as const;
export const LOGIC_ACTIONS = ["show", "hide", "require", "jump_to", "end_form", "set_variable"] as const;

export const PAGE_SECTIONS = ["header", "hero", "form", "deadline", "about", "why", "faq", "footer"] as const;
export const PAGE_LAYOUTS = ["cover", "split", "hero", "immersive"] as const;
export const BACKGROUND_TYPES = ["color", "image", "video"] as const;
export const BACKGROUND_TEXTURES = ["none", "dots", "grid", "lines"] as const;
export const FORM_CARD_STYLES = ["solid", "glass"] as const;

// Words that must never be a form slug or alias (they collide with app routes).
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
	"api",
	"admin",
	"login",
	"signup",
	"new",
	"dashboard",
	"embed",
	"settings",
	"f",
]);
