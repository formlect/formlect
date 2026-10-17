import mongoose from "mongoose";
import { env } from "@/common/utils/envConfig";

let isConnected = false;

export async function connectDB() {
	if (isConnected) {
		console.log("MongoDB already connected");
		return;
	}

	await mongoose.connect(env.DATABASE_URL);
	isConnected = true;
	console.log("MongoDB connected via Mongoose");
}

export const mongooseConnection = mongoose.connection;

// Helper to ensure connection before accessing db/client
export async function getMongoDbAndClient() {
	if (mongoose.connection.readyState !== 1) {
		await connectDB();
	}

	const db = mongoose.connection.db;
	const client = mongoose.connection.getClient();

	if (!db || !client) {
		throw new Error("MongoDB connection not ready");
	}

	return { db, client };
}

export async function disconnectDB() {
	await mongoose.disconnect();
	isConnected = false;
}
