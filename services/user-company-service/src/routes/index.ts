import { Router } from "express";
import userRoutes from "./user.routes";
import companyRoutes from "./company.routes";
import authRoutes from "./auth.routes";
import { isAuthenticated } from "../middlewares";

const router = Router();

router.use("/auth", authRoutes);

router.use((req, res, next) => {
	if (typeof isAuthenticated === "function") {
		isAuthenticated(req, res, next);
	} else {
		res.status(500).json({
			success: false,
			message: "Server configuration error.",
		});
	}
});

router.use("/users", userRoutes);
router.use("/companies", companyRoutes);

export default router;
