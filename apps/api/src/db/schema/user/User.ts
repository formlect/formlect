import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		id: String,
		name: String,
		email: String,
		emailVerified: Boolean,
		image: String,
		isOnboarded: Boolean,
		createdAt: Date,
		updatedAt: Date,
	},
	{ collection: "user" },
);

export const User = mongoose.model("User", userSchema);
