import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use(authRoutes);
router.use(userRoutes);
router.use(companyRoutes);

export default router;
