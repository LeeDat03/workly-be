import { Router } from "express";
import recommendController from "../controllers/recommend.controller";
import { optionalAuth } from "../middlewares";

const router = Router();

router.get("/users", optionalAuth, recommendController.getUserRecommendations);
router.get(
	"/companies",
	optionalAuth,
	recommendController.getCompanyRecommendations,
);

export default router;
