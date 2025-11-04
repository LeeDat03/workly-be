import userController from "../controllers/user.controller";
import { isAuthenticated } from "../middlewares";
import { validate } from "../middlewares/validation";
import { updateUserProfileSchema } from "../validators/user.validator";
import { Router } from "express";

const router = Router();

router.get("/", userController.getAllUsers);

router.use(isAuthenticated);

router.patch(
	"/me",
	validate(updateUserProfileSchema),
	userController.updateUser,
);

export default router;
