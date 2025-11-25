import { Router } from "express";

import { isAuthenticated, validate, optionalAuth } from "../middlewares";
import { companyController } from "../controllers";
import companyRoleRequestController from "../controllers/companyRoleRequest.controller";
import { isCompanyOwner } from "../middlewares/isCompanyOwner";
import { createCompanySchema, updateCompanySchema } from "../validators";
import upload from "../middlewares/checkUpload";

const router = Router();

router.post(
	"/",
	isAuthenticated,
	validate(createCompanySchema),
	companyController.createCompany,
);
router.get("/", companyController.getAllCompanies);
router.get("/my-companies", isAuthenticated, companyController.getMyCompanies);
router.get("/:id", companyController.getCompanyById);

router.get("/:id/check-access", optionalAuth, companyController.checkAccess);

//////////////////////////////////////////////////////////////
// ADMIN ACCESS - ADMIN ACTION
router.patch(
	"/:id",
	isAuthenticated,
	validate(updateCompanySchema),
	companyController.updateCompany,
);

router.patch(
	"/:id/media",
	isAuthenticated,
	upload.fields([
		{ name: "logo", maxCount: 1 },
		{ name: "banner", maxCount: 1 },
	]),
	companyController.updateCompanyMedia,
);

/////////////////////////////////////////////////////////////////
// FOLLOW
router.get("/:id/followers", companyController.getFollowers);
router.post("/:id/follow", isAuthenticated, companyController.follow);
router.delete("/:id/follow", isAuthenticated, companyController.unfollow);

router.get("/:id/is-following", optionalAuth, companyController.isFollowing);

//////////////////////////////////////////////////////////////////
// OWNER ACCESS - OWNER ACTION
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
