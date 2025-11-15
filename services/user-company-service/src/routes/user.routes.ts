import { Router } from "express";
import userController from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares";

const router = Router();

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);

// FOLLOW
router.get("/:id/following", userController.getFollowing);
router.get("/:id/followers", userController.getFollowers);
router.post("/:id/follow", isAuthenticated, userController.follow);
router.delete("/:id/follow", isAuthenticated, userController.unfollow);

export default router;
