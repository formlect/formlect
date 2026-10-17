import { CHOICE_FIELD_TYPES, type FieldType } from "@/db/schema/constants";
import type { AnswerInput } from "./formResponseModel";

// Checks submitted answers against the PUBLISHED form snapshot. Pure function, no I/O.
//
// Not evaluated here (ceiling, add when needed): logic rules that show/hide/require fields, `validation.pattern`
// (user-authored regex; running it server-side needs a ReDoS guard), and file_upload (no upload endpoint exists yet).

export type SnapshotField = {
	key: string;
	type: FieldType;
	required?: boolean;
	hidden?: boolean;
	options?: { key: string }[];
	scale?: { max?: number };
	validation?: {
		minLength?: number;
		maxLength?: number;
		min?: number;
		max?: number;
		minSelections?: number;
		maxSelections?: number;
	};
};

export type CheckedAnswer = AnswerInput & { fieldType: FieldType };

const TEXT = new Set<FieldType>(["short_text", "long_text", "email", "phone", "url"]);
const NUMBER = new Set<FieldType>(["number", "rating", "opinion_scale", "nps", "range"]);
const DATE = new Set<FieldType>(["date", "time"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isEmpty = (a: AnswerInput) =>
	a.skipped ||
	(a.text === undefined &&
		a.number === undefined &&
		a.boolean === undefined &&
		a.date === undefined &&
		!a.choices?.length &&
		!a.otherText);

function checkValue(f: SnapshotField, a: AnswerInput): string | null {
	const v = f.validation ?? {};
	if (TEXT.has(f.type)) {
		if (a.text === undefined) return "expects text";
		if (v.minLength !== undefined && a.text.length < v.minLength) return `needs at least ${v.minLength} characters`;
		if (v.maxLength !== undefined && a.text.length > v.maxLength) return `allows at most ${v.maxLength} characters`;
		if (f.type === "email" && !EMAIL.test(a.text)) return "needs a valid email";
		if (f.type === "url") {
			try {
				if (!/^https?:$/.test(new URL(a.text).protocol)) return "needs an http(s) link";
			} catch {
				return "needs a valid link";
			}
		}
	} else if (NUMBER.has(f.type)) {
		if (a.number === undefined) return "expects a number";
		if (f.type === "nps" && (a.number < 0 || a.number > 10)) return "must be 0-10";
		if ((f.type === "rating" || f.type === "opinion_scale") && (a.number < 1 || a.number > (f.scale?.max ?? 10)))
			return "is out of range";
		if (v.min !== undefined && a.number < v.min) return `must be at least ${v.min}`;
		if (v.max !== undefined && a.number > v.max) return `must be at most ${v.max}`;
	} else if (f.type === "yes_no") {
		if (a.boolean === undefined) return "expects yes or no";
	} else if (DATE.has(f.type)) {
		if (a.date === undefined) return "expects a date";
	} else if (CHOICE_FIELD_TYPES.includes(f.type)) {
		const picked = a.choices ?? [];
		const allowed = new Set(f.options?.map((o) => o.key));
		if (picked.some((k) => !allowed.has(k))) return "has an unknown option";
		if (new Set(picked).size !== picked.length) return "has duplicate options";
		if (f.type !== "multiple_choice" && picked.length > 1) return "allows one option";
		if (v.minSelections !== undefined && picked.length < v.minSelections)
			return `needs at least ${v.minSelections} options`;
		if (v.maxSelections !== undefined && picked.length > v.maxSelections)
			return `allows at most ${v.maxSelections} options`;
	}
	return null;
}

export function checkAnswers(
	fields: SnapshotField[],
	answers: AnswerInput[],
): { answers: CheckedAnswer[]; errors: string[] } {
	const byKey = new Map(fields.map((f) => [f.key, f]));
	const seen = new Set<string>();
	const errors: string[] = [];
	const checked: CheckedAnswer[] = [];

	for (const a of answers) {
		const f = byKey.get(a.fieldKey);
		if (!f) {
			errors.push(`${a.fieldKey}: unknown field`);
		} else if (seen.has(a.fieldKey)) {
			errors.push(`${a.fieldKey}: answered more than once`);
		} else if (f.type === "statement" || f.type === "file_upload") {
			errors.push(`${a.fieldKey}: this field type can't be answered here`);
		} else {
			seen.add(a.fieldKey);
			const problem = isEmpty(a) ? null : checkValue(f, a);
			if (problem) errors.push(`${a.fieldKey}: ${problem}`);
			else checked.push({ ...a, fieldType: f.type });
		}
	}

	for (const f of fields) {
		if (!f.required || f.hidden || f.type === "statement" || f.type === "file_upload") continue;
		const given = checked.find((a) => a.fieldKey === f.key);
		if (!given || isEmpty(given)) errors.push(`${f.key}: required`);
	}
	return { answers: checked, errors };
}
