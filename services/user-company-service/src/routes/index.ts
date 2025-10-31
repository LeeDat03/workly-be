import { Router } from "express";
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import { isAuthenticated } from "../middlewares";

const router = Router();

router.use("/auth", authRoutes);

router.use("/users", isAuthenticated, userRoutes);

// router.use("/companies", isAuthenticated, companyRoutes);

export default router;
