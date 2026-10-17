import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const url = z.string().url();
const csv = z
	.string()
	.transform((v) =>
		v
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean),
	)
	.pipe(z.array(url).min(1));

const envSchema = z.object({
	NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
	HOST: z.string().min(1).default("localhost"),
	PORT: z.coerce.number().int().positive().default(8080),
	// Number of reverse proxies in front of the app (0 = none). Never use `true`: it lets clients spoof their IP.
	TRUST_PROXY: z.coerce.number().int().min(0).default(0),

	// Origins allowed by CORS and Better Auth (comma-separated)
	CORS_ORIGINS: csv,

	COMMON_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(1000),
	COMMON_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(1000),

	DATABASE_URL: z.string().min(1),

	// Public URL of the web app (post-verification redirects, email links)
	WEB_URL: url,

	// Resend (transactional email). Key is mandatory in production; in dev links are logged instead.
	RESEND_API_KEY: z
		.string()
		.optional()
		.transform((v) => v || undefined),
	EMAIL_FROM: z.string().min(1).default("Formlect <onboarding@resend.dev>"),

	// Better Auth
	BETTER_AUTH_SECRET: z.string().min(32),
	BETTER_AUTH_URL: url,
	GOOGLE_ID: z.string().min(1),
	GOOGLE_SECRET: z.string().min(1),
	GOOGLE_REDIRECT_URI: url,
	GITHUB_ID: z.string().min(1),
	GITHUB_SECRET: z.string().min(1),
	GITHUB_REDIRECT_URI: url,
});

const parsedEnv = envSchema
	.refine((e) => e.NODE_ENV !== "production" || !!e.RESEND_API_KEY, {
		path: ["RESEND_API_KEY"],
		message: "required in production",
	})
	.safeParse(process.env);

if (!parsedEnv.success) {
	console.error("❌ Invalid environment variables:", parsedEnv.error.format());
	throw new Error("Invalid environment variables");
}

export const env = {
	...parsedEnv.data,
	isDevelopment: parsedEnv.data.NODE_ENV === "development",
	isProduction: parsedEnv.data.NODE_ENV === "production",
	isTest: parsedEnv.data.NODE_ENV === "test",
};
