import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares";
import { createUserSchema, signinSchema } from "../validators";

console.log("[ROUTER] File auth.routes.ts đang được nạp...");

const router = Router();

router.use((req, res, next) => {
	next();
});

router.post("/signup", validate(createUserSchema), authController.signup);
router.post(
	"/signin",
	validate(signinSchema.shape.body),
	authController.signin,
);
router.post("/signout", authController.signout);

export default router;
