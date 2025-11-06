import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import authRoutes from "./auth.routes";

const router = Router();

<<<<<<< HEAD
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/companies", companyRoutes);

=======
router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/users", userRoutes);
router.use("/api/v1/companies", companyRoutes);
>>>>>>> 9211fa8 (feat(user): CRUD education and establish a relationship user => education => school)
export default router;
