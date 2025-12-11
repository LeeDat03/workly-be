import express, { Router } from "express";
import { ControllerContainer } from "@/api/container/controller.container";
import { isAuthenticated } from "../middlewares/authentication.middleware";

export function createBookmarkRoutes(): Router {
	const router = express.Router();
	const bookmarkController = ControllerContainer.getBookmarkController();

	router.use(isAuthenticated);

	// Bookmark an item (post or job)
	router.post("/", bookmarkController.bookmarkItem);

	// Unbookmark an item
	router.post("/remove", bookmarkController.unbookmarkItem);

	// Get user's bookmarks
	router.get("/", bookmarkController.getUserBookmarks);

	// Get bookmark status for a specific item
	router.get("/status", bookmarkController.getBookmarkStatus);

	return router;
}

