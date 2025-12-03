import { Router } from "express";
import { isAuthenticated } from "../middlewares";
import userController from "../controllers/user.controller";
import { validate } from "../middlewares/validation";
import {
	changePasswordSchema,
	updateUserProfileSchema,
	updateUserSkillsSchema,
	updateUserIndustriesSchema,
	updateUserLocationSchema,
	updateEducationSchema,
	updateWorkExperienceSchema,
} from "../validators/user.validator";
import upload from "../middlewares/checkUpload";

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
	"/location",
	validate(updateUserLocationSchema),
	userController.updateUserLocation,
);
router.patch(
	"/educations",
	validate(updateEducationSchema),
	userController.updateUserEducations,
);
router.patch(
	"/work-experiences",
	validate(updateWorkExperienceSchema),
	userController.updateUserWorkExperiences,
);

router.patch(
	"/media",
	isAuthenticated,
	upload.fields([
		{ name: "avatar", maxCount: 1 },
		{ name: "background", maxCount: 1 },
	]),
	userController.updateUserMedia,
);
router.patch(
	"/change-password",
	validate(changePasswordSchema),
	userController.changeMyPassword,
);
router.delete("/", userController.deleteMe);

export default router;
