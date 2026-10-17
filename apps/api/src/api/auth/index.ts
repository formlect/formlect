// auth.ts

import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { APIError } from "better-auth/api";
import type { Db, MongoClient } from "mongodb";

import { ensurePersonalWorkspace } from "@/api/workspace/workspaceAccess";
import { env } from "@/common/utils/envConfig";
import { sendExistingAccountEmail, sendResetPasswordEmail, sendVerificationEmail } from "@/common/utils/mailer";
import { getMongoDbAndClient } from "@/db";
import { logger } from "@/server";

const MAX_NAME = 100;

const isHttpsUrl = (s: string) => {
	if (s.length > 2048) return false;
	try {
		return new URL(s).protocol === "https:";
	} catch {
		return false;
	}
};

const buildAuth = (db: Db, client: MongoClient) =>
	betterAuth({
		database: mongodbAdapter(db, { client }),
		baseURL: env.BETTER_AUTH_URL,
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			minPasswordLength: 8,
			resetPasswordTokenExpiresIn: 3600,
			sendResetPassword: async ({ user, url }) => {
				void sendResetPasswordEmail(user.email, url);
			},
			// Don't await email sends: it would leak whether an account exists via response timing
			onExistingUserSignUp: async ({ user }) => {
				void sendExistingAccountEmail(user.email);
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			sendOnSignIn: true, // re-sends the link when an unverified user tries to sign in
			autoSignInAfterVerification: true,
			sendVerificationEmail: async ({ user, url }) => {
				void sendVerificationEmail(user.email, url);
			},
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_ID,
				clientSecret: env.GOOGLE_SECRET,
				callbackURL: env.GOOGLE_REDIRECT_URI,
			},
			github: {
				clientId: env.GITHUB_ID,
				clientSecret: env.GITHUB_SECRET,
				callbackURL: env.GITHUB_REDIRECT_URI,
			},
		},
		// Same verified email via Google/GitHub/password links to one user instead of creating a duplicate
		account: {
			accountLinking: { enabled: true, trustedProviders: ["google", "github"] },
		},
		// Auth routes are mounted before the app limiter, so throttle them here (on in every env, not just production)
		// ponytail: in-memory per instance and keyed on Better Auth's IP detection; use secondaryStorage (Redis) when scaling out
		rateLimit: {
			enabled: true,
			window: 60,
			max: 60,
			customRules: {
				"/sign-in/email": { window: 60, max: 5 },
				"/sign-up/email": { window: 60, max: 3 },
				"/request-password-reset": { window: 300, max: 3 },
				"/send-verification-email": { window: 300, max: 3 },
			},
		},
		trustedOrigins: env.CORS_ORIGINS,
		user: {
			// Set only by POST /api/v1/onboarding/complete (input: false: clients can't send it to update-user)
			additionalFields: { isOnboarded: { type: "boolean", defaultValue: false, input: false } },
		},
		databaseHooks: {
			user: {
				create: {
					// Every user starts with a "Default workspace"; onboarding lets them rename it
					after: async (user) => {
						try {
							await ensurePersonalWorkspace(user);
						} catch (err) {
							// Don't fail sign-up: ensurePersonalWorkspace runs again on onboarding and on the first form
							logger.error(`Default workspace creation failed: ${(err as Error).message}`);
						}
					},
				},
				// update-user (name/avatar from the onboarding dialog) takes any string; cap it here
				update: {
					before: async (data) => {
						if (typeof data.name === "string" && (!data.name.trim() || data.name.length > MAX_NAME))
							throw new APIError("BAD_REQUEST", { message: `Name must be 1-${MAX_NAME} characters` });
						if (typeof data.image === "string" && !isHttpsUrl(data.image))
							throw new APIError("BAD_REQUEST", { message: "Avatar must be an https URL" });
					},
				},
			},
		},
	});

type AuthInstance = ReturnType<typeof buildAuth>;

let authPromise: Promise<AuthInstance> | null = null;

// Lazy initialization - only create auth when database is ready.
// Caching the promise means concurrent first requests share one instance.
export function getAuth(): Promise<AuthInstance> {
	authPromise ??= getMongoDbAndClient()
		.then(({ db, client }) => buildAuth(db, client))
		.catch((err) => {
			authPromise = null; // allow retry after a failed connect
			throw err;
		});
	return authPromise;
}

// Export auth instance getter for use in routes
export const auth = getAuth;
