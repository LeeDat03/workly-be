import userController from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares";
import { validate } from "../middlewares/validation";
import {
	changePasswordSchema,
	updateUserProfileSchema,
} from "../validators/user.validator";
import { Router } from "express";

const router = Router();

router.get("/", userController.getAllUsers);

router.use(isAuthenticated);

router.get("/me", userController.getMe);

router.patch(
	"/me",
	validate(updateUserProfileSchema),
	userController.updateBasicProfile,
);

router.patch("/me/skills", userController.updateUserSkills);
router.patch("/me/industries", userController.updateUserIndustries);
router.patch("/me/schools", userController.updateUserSchools);
router.patch(
	"/me/change-password",
	validate(changePasswordSchema),
	userController.changeMyPassword,
);

router.delete("/me", userController.deleteMe);

export default router;
