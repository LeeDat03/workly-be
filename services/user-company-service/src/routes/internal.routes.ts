import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import userController from "../controllers/user.controller";
import companyController from "../controllers/company.controller";

const router = Router();

router.post("/users/get-batch", userController.getUsersByIds);
router.post("/companies/get-batch", companyController.getCompaniesByIds);

export default router;
