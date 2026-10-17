import type { FormRole, FormStatus } from "../constants";

// Pure helpers over a form document (or its lean/JSON shape); kept out of the schema so they are typed and easy to test.

type Id = { toString(): string } | string;

export function roleOf(form: { collaborators?: { user: Id; role: FormRole }[] | null }, userId: Id): FormRole | null {
	return form.collaborators?.find((c) => String(c.user) === String(userId))?.role ?? null;
}

export function isAcceptingResponses(
	form: {
		status: FormStatus;
		settings?: {
			acceptingResponses?: boolean | null;
			opensAt?: Date | null;
			closesAt?: Date | null;
			responseLimit?: number | null;
		} | null;
		stats?: { responses?: number | null } | null;
	},
	now = new Date(),
): boolean {
	const s = form.settings ?? {};
	if (form.status !== "published" || s.acceptingResponses === false) return false;
	if (s.opensAt && now < s.opensAt) return false;
	if (s.closesAt && now > s.closesAt) return false;
	if (s.responseLimit && (form.stats?.responses ?? 0) >= s.responseLimit) return false;
	return true;
}
