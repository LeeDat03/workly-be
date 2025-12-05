import { Router } from "express";
import conversationRoutes from "./conversation.routes";
import messageRoutes from "./message.routes";
import { userRoutes } from "./user.routes";
import internalRoutes from "./internal.routes";

const router = Router();

// Health check
router.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "Chat service is healthy",
		timestamp: new Date().toISOString(),
	});
});

// API routes
router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/users", userRoutes);
router.use("/internals", internalRoutes);

export default router;
