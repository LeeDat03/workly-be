import { Router } from "express";
import { validate } from "../middlewares";
import { healthCheckSchema } from "../validators";
import healthController from "../controllers/health.controller";

const router = Router();

router.post("/", validate(healthCheckSchema), healthController.checkHealth);

export default router;
