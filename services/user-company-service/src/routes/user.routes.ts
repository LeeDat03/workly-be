import userController from "../controllers/user.controller";
import { validate } from "../middlewares/validation";
import { createUserSchema } from "../validators/user.validator";
import { Router } from "express";

const router = Router();

router.post("/", validate(createUserSchema), userController.createUser);
router.get("/", userController.getAllUsers);

export default router;
