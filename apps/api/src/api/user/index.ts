import { type Router as ExpressRouter, Router } from "express";
import { User } from "@/db/schema";

const router: ExpressRouter = Router();
router.get("/users", async (_req, res) => {
	try {
		const users = await User.find({});

		res.json({
			success: true,
			count: users.length,
			data: users,
		});
	} catch {
		res.status(500).json({
			success: false,
			error: "Failed to fetch users",
		});
	}
});

export default router;
