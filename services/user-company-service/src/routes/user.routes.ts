import { Router } from "express";
import userController from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares";
import { validate } from "../middlewares/validation";
import {
	changePasswordSchema,
	updateUserProfileSchema,
	updateUserSkillsSchema,
	updateUserIndustriesSchema,
} from "../validators/user.validator";
import { updateEducationSchema } from "../validators/user.validator";

const router = Router();

router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);

router.use(isAuthenticated);

router.get("/me", userController.getMe);
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
