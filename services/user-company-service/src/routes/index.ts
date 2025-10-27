import { Router } from "express";
import healthRoutes from "./health.routes";
import userRoutes from "./user.routes";

const router = Router();

// Health check route
router.use("/health", healthRoutes);

router.use("/users", userRoutes);

// router.use('/companies', companyRoutes);

export default router;
