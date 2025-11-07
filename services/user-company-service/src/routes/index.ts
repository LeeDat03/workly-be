import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import authRoutes from "./auth.routes";
import industryRoutes from "./industry.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/industries", industryRoutes);

export default router;
