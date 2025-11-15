import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import authRoutes from "./auth.routes";
import industryRoutes from "./industry.routes";
import meRoutes from "./me.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/industries", industryRoutes);

export default router;
