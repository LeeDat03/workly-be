import { Router } from "express";

import { validate } from "../middlewares";
import { companyController } from "../controllers";
import { createCompanySchema, updateCompanySchema } from "../validators";

// TODO feature:
// 1.✔ user create/update/delete a company page
// 3. Get all company, find company by name
// 2. user grant persmission for other user to manage page (HR)

// TODO: GET USER FROM JWT
const router = Router();

router.post(
	"/",
	validate(createCompanySchema),
	companyController.createCompany,
);
router.get("/", companyController.getAllCompanies);
router.get("/:id", companyController.getCompanyById);
router.patch(
	"/:id",
	validate(updateCompanySchema),
	companyController.updateCompany,
);
router.delete("/:id", companyController.deleteCompany);

export default router;
