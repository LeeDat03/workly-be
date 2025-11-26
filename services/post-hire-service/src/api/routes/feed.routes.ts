import express, { Router } from "express";
import { ControllerContainer } from "@/api/container/controller.container";
import { isAuthenticated } from "../middlewares/authentication.middleware";

export function createFeedRoutes(): Router {
	const router = express.Router();
	const feedController = ControllerContainer.getFeedController();
	router.use(isAuthenticated);
	router.get("/", feedController.getFeed);

	return router;
}
