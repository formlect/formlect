import { describe, expect, it } from "vitest";
import { checkAnswers, type SnapshotField } from "../formResponseValidation";

const fields: SnapshotField[] = [
	{ key: "name", type: "short_text", required: true, validation: { maxLength: 5 } },
	{ key: "mail", type: "email" },
	{ key: "pick", type: "single_choice", options: [{ key: "a" }, { key: "b" }] },
	{ key: "many", type: "multiple_choice", options: [{ key: "x" }, { key: "y" }], validation: { maxSelections: 1 } },
	{ key: "stars", type: "rating", scale: { max: 5 } },
	{ key: "agree", type: "yes_no" },
	{ key: "doc", type: "file_upload", required: true },
	{ key: "note", type: "statement" },
];

const check = (answers: object[]) => checkAnswers(fields, answers as never);

describe("checkAnswers", () => {
	it("accepts valid answers and stamps the field type from the form, not the client", () => {
		const r = check([
			{ fieldKey: "name", text: "Ada" },
			{ fieldKey: "stars", number: 4 },
			{ fieldKey: "agree", boolean: false },
		]);
		expect(r.errors).toEqual([]);
		expect(r.answers.map((a) => a.fieldType)).toEqual(["short_text", "rating", "yes_no"]);
	});

	it("requires required fields (skipped counts as empty) but never file uploads", () => {
		expect(check([]).errors).toEqual(["name: required"]);
		expect(check([{ fieldKey: "name", skipped: true }]).errors).toEqual(["name: required"]);
	});

	it("rejects unknown fields, duplicates and unanswerable types", () => {
		const r = check([
			{ fieldKey: "name", text: "Ada" },
			{ fieldKey: "name", text: "B" },
			{ fieldKey: "ghost", text: "x" },
			{ fieldKey: "note", text: "x" },
			{ fieldKey: "doc", text: "x" },
		]);
		expect(r.errors).toEqual(
			expect.arrayContaining([
				"name: answered more than once",
				"ghost: unknown field",
				"note: this field type can't be answered here",
				"doc: this field type can't be answered here",
			]),
		);
	});

	it("checks text rules", () => {
		expect(check([{ fieldKey: "name", text: "Too long" }]).errors).toContain("name: allows at most 5 characters");
		expect(
			check([
				{ fieldKey: "name", text: "Ada" },
				{ fieldKey: "mail", text: "nope" },
			]).errors,
		).toContain("mail: needs a valid email");
		expect(check([{ fieldKey: "name", number: 3 }]).errors).toContain("name: expects text");
	});

	it("checks choices against the option keys", () => {
		const ok = { fieldKey: "name", text: "Ada" };
		expect(check([ok, { fieldKey: "pick", choices: ["z"] }]).errors).toContain("pick: has an unknown option");
		expect(check([ok, { fieldKey: "pick", choices: ["a", "b"] }]).errors).toContain("pick: allows one option");
		expect(check([ok, { fieldKey: "many", choices: ["x", "y"] }]).errors).toContain("many: allows at most 1 options");
		expect(check([ok, { fieldKey: "many", choices: ["x"] }]).errors).toEqual([]);
	});

	it("keeps ratings inside the scale", () => {
		expect(
			check([
				{ fieldKey: "name", text: "Ada" },
				{ fieldKey: "stars", number: 6 },
			]).errors,
		).toContain("stars: is out of range");
	});
});
