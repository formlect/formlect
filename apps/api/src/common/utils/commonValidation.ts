import { z } from "zod";

export const commonValidations = {
	/** A MongoDB ObjectId as a 24-char hex string; anything else is a 400 instead of a Mongoose CastError (500). */
	id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id"),
};
