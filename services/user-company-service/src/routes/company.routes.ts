import { Router } from "express";

import { createCompanySchema, updateCompanySchema } from "../validators";
import { validate } from "../middlewares";
import { companyController } from "../controllers";
import companyRoleRequestController from "../controllers/companyRoleRequest.controller";
import { checkCompanyOwner } from "../middlewares/checkCompanyOwner";

// TODO: GET USER FROM JWT
const router = Router();

router.post(
	"/",
	validate(createCompanySchema),
	companyController.createCompany,
);
router.get("/", companyController.getAllCompanies);
router.get("/:id", companyController.getCompanyById);

// TODO: check if admin, owner
router.patch(
	"/:id",
	validate(updateCompanySchema),
	companyController.updateCompany,
);

// OWNER ACCESS
const ownerRoutes = Router({ mergeParams: true });
ownerRoutes.use(checkCompanyOwner);

ownerRoutes.post("/admins", companyRoleRequestController.addAdminToCompany);
ownerRoutes.get("/admins", companyRoleRequestController.viewAllCurrentAdmins);
ownerRoutes.delete(
	"/admins/:userId",
	companyRoleRequestController.removeAdminFromCompany,
);
ownerRoutes.delete("/:id", companyController.deleteCompany);

router.use("/:id", ownerRoutes);

export default router;
