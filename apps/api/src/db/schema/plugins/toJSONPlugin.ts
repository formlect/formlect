import type { Schema } from "mongoose";

// Shared toJSON: `id` instead of `_id`, no `__v`, and the listed (dot-)paths removed.
export function toJSONPlugin(schema: Schema, { hide = [] }: { hide?: string[] } = {}) {
	schema.set("toJSON", {
		virtuals: true,
		versionKey: false,
		transform(_doc, ret: Record<string, unknown>) {
			ret.id = String(ret._id);
			delete ret._id;
			for (const path of hide) {
				const keys = path.split(".");
				const last = keys.pop() as string;
				let target: unknown = ret;
				for (const k of keys) target = (target as Record<string, unknown> | undefined)?.[k];
				if (target && typeof target === "object") delete (target as Record<string, unknown>)[last];
			}
			return ret;
		},
	});
}
