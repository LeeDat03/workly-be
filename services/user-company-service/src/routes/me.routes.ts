import { Router } from "express";
import { isAuthenticated } from "../middlewares";
import userController from "../controllers/user.controller";
import { validate } from "../middlewares/validation";
import {
	changePasswordSchema,
	updateUserProfileSchema,
	updateUserSkillsSchema,
	updateUserIndustriesSchema,
	updateEducationSchema,
} from "../validators/user.validator";

const router = Router();

router.use(isAuthenticated);

router.get("/", userController.getMe);
router.patch(
	"/",
	validate(updateUserProfileSchema),
	userController.updateBasicProfile,
);
router.patch(
	"/skills",
	validate(updateUserSkillsSchema),
	userController.updateUserSkills,
);
router.patch(
	"/industries",
	validate(updateUserIndustriesSchema),
	userController.updateUserIndustries,
);
router.patch(
	"/educations",
	validate(updateEducationSchema),
	userController.updateUserEducations,
);
router.patch(
	"/change-password",
	validate(changePasswordSchema),
	userController.changeMyPassword,
);
router.delete("/me", userController.deleteMe);

export default router;
