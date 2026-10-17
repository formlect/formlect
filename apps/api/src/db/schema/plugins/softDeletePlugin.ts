import type { Query, Schema } from "mongoose";

const QUERY_OPS = ["find", "findOne", "countDocuments", "findOneAndUpdate", "updateMany", "updateOne"] as const;

// Soft delete: `deletedAt` + softDelete()/restore(); soft-deleted docs are excluded from queries unless
// the query sets `{ withDeleted: true }` or filters on `deletedAt` itself.
export function softDeletePlugin(schema: Schema) {
	schema.add({ deletedAt: { type: Date, default: null, index: true } });

	schema.methods.softDelete = function (this: { deletedAt: Date | null; save: () => Promise<unknown> }) {
		this.deletedAt = new Date();
		return this.save();
	};
	schema.methods.restore = function (this: { deletedAt: Date | null; save: () => Promise<unknown> }) {
		this.deletedAt = null;
		return this.save();
	};

	const excludeDeleted = function (this: Query<unknown, unknown>) {
		if ((this.getOptions() as { withDeleted?: boolean }).withDeleted) return;
		if (!("deletedAt" in this.getQuery())) this.where({ deletedAt: null });
	};
	for (const op of QUERY_OPS) schema.pre(op, excludeDeleted);
}
