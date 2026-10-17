import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";
import { auth } from "@/api/auth";
import type { IUser } from "@/types";

// Extend Express Request to include user
declare global {
	namespace Express {
		interface Request {
			user?: IUser;
		}
	}
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
	try {
		// Call Better Auth getSession
		const authInstance = await auth();
		const session = await authInstance.api.getSession({
			headers: fromNodeHeaders(req.headers),
		});

		// If no session or no user → unauthorized
		if (!session || !session.user) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		// Attach user & session to req
		req.user = session.user as IUser;

		// Continue to next middleware/handler
		next();
	} catch (err) {
		console.error("Auth check error", err);
		return res.status(401).json({ error: "Unauthorized" });
	}
}
