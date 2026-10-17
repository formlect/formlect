import mongoose from "mongoose";

// Global Mongoose safety settings. Importing models from here guarantees they are applied and that every model
// (including those only referenced via `ref`) is registered.
mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true); // $-operators in a filter value are wrapped in $eq; use `mongoose.trusted()` for our own

export { default as Comment } from "./comment/Comment";
export type { FieldType, FormRole, FormStatus, Role } from "./constants";
export * as constants from "./constants";
export { default as FileAsset } from "./file-asset/FileAsset";
export { default as Form } from "./form/Form";
export { default as FormVersion } from "./form/FormVersion";
export { isAcceptingResponses, roleOf } from "./form/formHelpers";
export { default as Response } from "./response/Response";
// `User` is a read-only mirror of Better Auth's `user` collection; Better Auth owns users, sessions and accounts.
export { User } from "./user/User";
export { default as Workspace } from "./workspace/Workspace";
export { workspaceRoleOf } from "./workspace/workspaceHelpers";
