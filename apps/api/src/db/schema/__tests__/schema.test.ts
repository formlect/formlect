import mongoose from "mongoose";
import { describe, expect, it } from "vitest";
import { Form, isAcceptingResponses, Workspace } from "@/db/schema";

// Schema-level rules only: validate() runs validators and pre-validate hooks without a database connection.
const id = () => new mongoose.Types.ObjectId();
const base = () => ({ workspace: id(), createdBy: id(), title: "Survey" });
const text = (key: string, extra = {}) => ({ key, type: "short_text", ...extra });
const choice = (key: string, extra = {}) => ({
	key,
	type: "single_choice",
	options: [{ key: "a", label: "A" }],
	...extra,
});

const errorsOf = async (data: object) => {
	try {
		await new Form({ ...base(), ...data }).validate();
		return null;
	} catch (e) {
		return (e as Error).message;
	}
};

describe("Form schema", () => {
	it("accepts a minimal form with defaults", async () => {
		const form = new Form(base());
		await form.validate();
		expect(form.status).toBe("draft");
		expect(form.page?.sections).toHaveLength(8);
	});

	it("rejects duplicate field keys", async () => {
		expect(await errorsOf({ fields: [text("q1"), text("q1")] })).toMatch(/Field keys must be unique/);
	});

	it("requires unique options on choice fields", async () => {
		expect(await errorsOf({ fields: [choice("q1", { options: [] })] })).toMatch(/at least one option/);
		expect(
			await errorsOf({
				fields: [
					choice("q1", {
						options: [
							{ key: "a", label: "A" },
							{ key: "a", label: "B" },
						],
					}),
				],
			}),
		).toMatch(/unique keys/);
	});

	it("checks appearance against the field type", async () => {
		expect(await errorsOf({ fields: [text("q1", { appearance: "stars" })] })).toMatch(/not valid for this field type/);
		expect(await errorsOf({ fields: [text("q1", { appearance: "boxed" })] })).toBeNull();
	});

	it("rejects logic that points at a missing field", async () => {
		const rule = (fieldKey: string, targetKey: string) => ({
			key: "r1",
			conditions: [{ fieldKey, operator: "is", value: "x" }],
			actions: [{ type: "show", targetKey }],
		});
		expect(await errorsOf({ fields: [text("q1"), text("q2")], logic: [rule("q1", "q2")] })).toBeNull();
		expect(await errorsOf({ fields: [text("q1")], logic: [rule("nope", "q1")] })).toMatch(/unknown field nope/);
		expect(await errorsOf({ fields: [text("q1")], logic: [rule("q1", "nope")] })).toMatch(/unknown target nope/);
	});

	it("keeps the form section on the landing page", async () => {
		const sections = [
			{ type: "header", enabled: true },
			{ type: "form", enabled: false },
		];
		expect(await errorsOf({ page: { sections } })).toMatch(/include the form/);
	});

	it("validates slugs and colours", async () => {
		expect(await errorsOf({ slug: "Bad Slug!" })).toMatch(/slug/i);
		expect(await errorsOf({ design: { accent: "red; background:url(x)" } })).toMatch(/accent/);
	});

	it("validates aliases and lowercases them", async () => {
		expect(await errorsOf({ alias: "Bad Alias!" })).toMatch(/alias/i);
		const form = new Form({ ...base(), alias: "My-Survey" });
		await form.validate();
		expect(form.alias).toBe("my-survey");
	});

	it("serialises with `id`, without `_id`, and hides the share password hash", () => {
		const json = new Form({ ...base(), share: { visibility: "password", passwordHash: "secret" } }).toJSON() as Record<
			string,
			unknown
		>;
		expect(json.id).toEqual(expect.any(String));
		expect(json._id).toBeUndefined();
		expect((json.share as Record<string, unknown>).passwordHash).toBeUndefined();
	});
});

describe("Workspace schema", () => {
	it("needs an owner", async () => {
		const member = { user: id(), role: "editor" };
		await expect(new Workspace({ name: "W", slug: "w1", members: [member] }).validate()).rejects.toThrow(
			/needs an owner/,
		);
		await expect(
			new Workspace({ name: "W", slug: "w1", members: [{ ...member, role: "owner" }] }).validate(),
		).resolves.toBeUndefined();
	});
});

describe("isAcceptingResponses", () => {
	const published = { status: "published" as const, settings: {}, stats: { responses: 0 } };
	const now = new Date("2026-06-01T12:00:00Z");

	it("is true for an open published form", () => expect(isAcceptingResponses(published, now)).toBe(true));
	it("is false for drafts and when switched off", () => {
		expect(isAcceptingResponses({ ...published, status: "draft" }, now)).toBe(false);
		expect(isAcceptingResponses({ ...published, settings: { acceptingResponses: false } }, now)).toBe(false);
	});
	it("honours the schedule and the response limit", () => {
		expect(isAcceptingResponses({ ...published, settings: { opensAt: new Date("2026-07-01") } }, now)).toBe(false);
		expect(isAcceptingResponses({ ...published, settings: { closesAt: new Date("2026-05-01") } }, now)).toBe(false);
		expect(isAcceptingResponses({ ...published, settings: { responseLimit: 2 }, stats: { responses: 2 } }, now)).toBe(
			false,
		);
	});
});
