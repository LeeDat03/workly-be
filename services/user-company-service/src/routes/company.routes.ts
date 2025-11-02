import { Router } from "express";

import { createCompanySchema, updateCompanySchema } from "../validators";
import { isAuthenticated, validate } from "../middlewares";
import { companyController } from "../controllers";
import companyRoleRequestController from "../controllers/companyRoleRequest.controller";
import { isCompanyOwner } from "../middlewares/isCompanyOwner";

const router = Router();

router.post(
	"/",
	isAuthenticated,
	validate(createCompanySchema),
	companyController.createCompany,
);
router.get("/", companyController.getAllCompanies);
router.get("/:id", companyController.getCompanyById);

router.patch(
	"/:id",
	isAuthenticated,
	validate(updateCompanySchema),
	companyController.updateCompany,
);

// OWNER ACCESS
const ownerRoutes = Router({ mergeParams: true });
ownerRoutes.use(isAuthenticated, isCompanyOwner);

ownerRoutes.post("/admins", companyRoleRequestController.addAdminToCompany);
ownerRoutes.get("/admins", companyRoleRequestController.viewAllCurrentAdmins);
ownerRoutes.delete(
	"/admins/:userId",
	companyRoleRequestController.removeAdminFromCompany,
);
ownerRoutes.delete("/:id", companyController.deleteCompany);

router.use("/:id", ownerRoutes);

export default router;
