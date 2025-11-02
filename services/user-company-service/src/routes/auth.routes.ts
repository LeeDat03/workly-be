import { Router } from "express";
import { authController } from "../controllers";
import { isAuthenticated, validate } from "../middlewares";
import { createUserSchema, signinSchema } from "../validators";

const router = Router();

router.post("/signup", validate(createUserSchema), authController.signup);
router.post("/signin", validate(signinSchema), authController.signin);
router.post("/signout", authController.signout);

router.get("/me", isAuthenticated, authController.getMe);
export default router;
