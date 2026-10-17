import { env } from "@/common/utils/envConfig";
import { app, logger } from "@/server";
import { connectDB, disconnectDB } from "./db";

async function main() {
	// Connect before accepting traffic so requests never hit a half-ready app
	await connectDB();
	logger.info("Database connected successfully!");

	const server = app.listen(env.PORT, () => {
		logger.info(`Server (${env.NODE_ENV}) running on port http://${env.HOST}:${env.PORT}`);
	});

	const shutdown = () => {
		logger.info("shutdown signal received");
		server.close(async () => {
			await disconnectDB();
			logger.info("server closed");
			process.exit(0);
		});
		setTimeout(() => process.exit(1), 10000).unref();
	};

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

process.on("unhandledRejection", (reason) => logger.error(reason, "unhandled rejection"));

main().catch((err) => {
	logger.error(err, "failed to start");
	process.exit(1);
});
