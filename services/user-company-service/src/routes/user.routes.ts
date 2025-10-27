import { userController } from "../controllers";
import { validate } from "../middlewares";
import { createUserSchema } from "../validators";
import { Router } from "express";

const router = Router();

router.post(
	"/",
	//  validate(createUserSchema),
	userController.createUser,
);

export default router;
