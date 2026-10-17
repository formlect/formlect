import { customAlphabet } from "nanoid";
import type { FormService } from "@/api/form/formService";
import { RESERVED_SLUGS } from "@/db/schema/constants";
import { logger } from "@/server";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const SLUG_LENGTH = 8;
const MAX_TRIES = 3;

const nano = customAlphabet(ALPHABET, SLUG_LENGTH);

export class SlugGenerationError extends Error {
	constructor() {
		super("Could not generate a unique slug");
		this.name = "SlugGenerationError";
	}
}

export async function generateUniqueSlug(formService: FormService): Promise<string> {
	for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
		const slug = nano();

		if (RESERVED_SLUGS.has(slug.toLowerCase())) continue;

		const result = await formService.checkSlugAvailability(slug);
		if (!result.success) throw new Error(result.message);
		if (result.responseObject?.available) return slug;
	}

	// 3 misses in a row is ~impossible, so this means a bug, not bad luck
	logger.error(
		{ attempts: MAX_TRIES, alphabetSize: ALPHABET.length, length: SLUG_LENGTH },
		"Slug generation exhausted retries",
	);
	throw new SlugGenerationError();
}
