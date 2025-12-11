import { Router } from "express";

import {
	isAuthenticated,
	validate,
	optionalAuth,
	isCompanyAdmin,
	isCompanyAdminOrSelf,
} from "../middlewares";
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
router.get("/:id", optionalAuth, companyController.getCompanyById);

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
// ADMIN ACCESS (OWNER + ADMIN) - Can view and add admins
const adminRoutes = Router({ mergeParams: true });
adminRoutes.use(isAuthenticated, isCompanyAdmin);

adminRoutes.get("/admins", companyRoleRequestController.viewAllCurrentAdmins);
adminRoutes.post("/admins", companyRoleRequestController.addAdminToCompany);

router.use("/:id", adminRoutes);

//////////////////////////////////////////////////////////////////
// ADMIN OR SELF ACCESS - OWNER can remove anyone, ADMIN can remove self
const adminOrSelfRoutes = Router({ mergeParams: true });
adminOrSelfRoutes.delete(
	"/admins/:userId",
	isAuthenticated,
	isCompanyAdminOrSelf,
	companyRoleRequestController.removeAdminFromCompany,
);

router.use("/:id", adminOrSelfRoutes);

//////////////////////////////////////////////////////////////////
// OWNER ACCESS - OWNER ONLY ACTIONS
const ownerRoutes = Router({ mergeParams: true });
ownerRoutes.use(isAuthenticated, isCompanyOwner);

ownerRoutes.delete("/", companyController.deleteCompany);

router.use("/:id", ownerRoutes);

export default router;
