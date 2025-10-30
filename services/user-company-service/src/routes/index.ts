import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/companies", companyRoutes);

export default router;
