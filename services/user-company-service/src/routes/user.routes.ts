import { Router } from "express";
import userController from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares"; // <-- "Người gác cổng"
import { validate } from "../middlewares/validation";
import {
	changePasswordSchema,
	updateUserProfileSchema,
	updateUserSkillsSchema,
	updateUserIndustriesSchema,
	updateEducationSchema,
} from "../validators/user.validator";

const router = Router();

// PRIVATE ROUTE
router.get("/me", isAuthenticated, userController.getMe);

router.patch(
	"/me",
	isAuthenticated,
	validate(updateUserProfileSchema),
	userController.updateBasicProfile,
);
router.patch(
	"/me/skills",
	isAuthenticated,
	validate(updateUserSkillsSchema),
	userController.updateUserSkills,
);
router.patch(
	"/me/industries",
	isAuthenticated,
	validate(updateUserIndustriesSchema),
	userController.updateUserIndustries,
);
router.patch(
	"/me/educations",
	isAuthenticated,
	validate(updateEducationSchema),
	userController.updateUserEducations,
);
router.patch(
	"/me/change-password",
	isAuthenticated,
	validate(changePasswordSchema),
	userController.changeMyPassword,
);
router.delete("/me", isAuthenticated, userController.deleteMe);

// PUBLIC ROUTE
router.get("/", userController.getAllUsers);

router.get("/:id", userController.getUserById);

export default router;
