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
import educationController from "../controllers/education.controller";
import {
	createEducationSchema,
	updateEducationSchema,
} from "../validators/education.validator";

const router = Router();

router.get("/", userController.getAllUsers);

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
	"/me/change-password",
	validate(changePasswordSchema),
	userController.changeMyPassword,
);
router.delete("/me", userController.deleteMe);

// Education
router.get("/me/educations", educationController.getAllMyEducations);
router.post(
	"/me/educations",
	validate(createEducationSchema),
	educationController.createEducation,
);
router.patch(
	"/me/educations/:educationId",
	validate(updateEducationSchema),
	educationController.updateEducation,
);
router.delete(
	"/me/educations/:educationId",
	educationController.deleteEducation,
);

export default router;
