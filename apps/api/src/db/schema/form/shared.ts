// Reusable path definitions for the form sub-schemas.
export const hex = { type: String, match: /^#[0-9a-f]{6}([0-9a-f]{2})?$/i };
/** Stable client-generated id. Fields, rules, options and sections use it instead of `_id`, so reordering, logic and answers survive edits. */
export const key = { type: String, required: true, match: /^[a-zA-Z0-9_-]{1,64}$/ };
