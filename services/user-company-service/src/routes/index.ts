import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import authRoutes from "./auth.routes";
import industryRoutes from "./industry.routes";
import meRoutes from "./me.routes";
import skillRoutes from "./skill.routes";
import schoolRoutes from "./school.routes";
import locationRoutes from "./location.routes";
import internalRoutes from "./internal.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/industries", industryRoutes);
router.use("/skills", skillRoutes);
router.use("/schools", schoolRoutes);
router.use("/locations", locationRoutes);

// Service - Service communicate
router.use("/internals", internalRoutes);

export default router;
