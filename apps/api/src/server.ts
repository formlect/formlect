import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import requestIp from "request-ip";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import { auth } from "./api/auth";
import { formRouter } from "./api/form/formRouter";
import { formResponseRouter } from "./api/formResponse/formResponseRouter";
import { onboardingRouter } from "./api/onboarding/onboardingRouter";
import User from "./api/user";
import { workspaceRouter } from "./api/workspace/workspaceRouter";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", env.TRUST_PROXY);

// Middlewares

app.use(requestIp.mw());

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || env.CORS_ORIGINS.includes(origin)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// Helmet first so /api/auth/* gets security headers too
app.use(helmet());

// Better Auth handler - MUST be before express.json()
// ✅ FIXED: Use Express v5 syntax with named wildcard parameter
// app.all("/api/auth/{*authPath}", toNodeHandler(auth));

app.all("/api/auth/{*authPath}", async (req, res, next) => {
	try {
		const authInstance = await auth();
		return toNodeHandler(authInstance)(req, res);
	} catch (error) {
		next(error);
	}
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/u", User);
app.use("/api/v1/forms", formRouter);
app.use("/api/v1/form-response", formResponseRouter);
app.use("/api/v1/onboarding", onboardingRouter);
app.use("/api/v1/workspaces", workspaceRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
