import { Router } from "express";
import { authController } from "../controllers";
import { isAuthenticated, validate } from "../middlewares";
import {
	createUserSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
	signinSchema,
} from "../validators";
import { oauthSchema } from "../validators/oauth.validator";

const router = Router();

router.post("/signup", validate(createUserSchema), authController.signup);
router.post("/signin", validate(signinSchema), authController.signin);
router.post("/signout", authController.signout);

router.post(
	"/forgot-password",
	validate(forgotPasswordSchema),
	authController.forgotPassword,
);

router.patch(
	"/reset-password/:token",
	validate(resetPasswordSchema),
	authController.resetPassword,
);

router.get("/me", isAuthenticated, authController.getMe);

router.post("/oauth", validate(oauthSchema), authController.handleOAuth);
export default router;
