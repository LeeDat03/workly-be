import { Router } from "express";
import userController from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares";
import { validate } from "../middlewares/validation";
import {
	changePasswordSchema,
	updateUserProfileSchema,
	updateUserSkillsSchema,
	updateUserIndustriesSchema,
	updateEducationSchema,
} from "../validators/user.validator";

const router = Router();

// PUBLIC ROUTE
router.get("/", userController.getAllUsers);
router.get("/me", isAuthenticated, userController.getMe);
router.get("/skills", userController.getAllSkills);
router.get("/schools", userController.getAllSchools);
router.get("/:id", userController.getUserById);

// PRIVATE ROUTE
router.use(isAuthenticated);
router.patch(
	"/me",
	validate(updateUserProfileSchema),
	userController.updateBasicProfile,
);

router.patch(
	"/me/skills",
	validate(updateUserSkillsSchema),
	userController.updateUserSkills,
);
router.patch(
	"/me/industries",
	validate(updateUserIndustriesSchema),
	userController.updateUserIndustries,
);
router.patch(
	"/me/educations",
	validate(updateEducationSchema),
	userController.updateUserEducations,
);
router.patch(
	"/me/change-password",
	validate(changePasswordSchema),
	userController.changeMyPassword,
);
router.delete("/me", userController.deleteMe);

export default router;
