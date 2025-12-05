import express, { Router } from "express";
import { ControllerContainer } from "@/api/container/controller.container";
import {
	isAuthenticated,
	optionalAuth,
} from "../middlewares/authentication.middleware";

export function createFeedRoutes(): Router {
	const router = express.Router();
	const feedController = ControllerContainer.getFeedController();
	router.get("/", optionalAuth, feedController.getFeed);

	router.get("/job", optionalAuth, feedController.getJobFeed);

	return router;
}
