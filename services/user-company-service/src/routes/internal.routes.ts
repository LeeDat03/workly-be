import { Router } from "express";
import userController from "../controllers/user.controller";
import companyController from "../controllers/company.controller";
import feedController from "../controllers/feed.controller";
import internalController from "../controllers/internal.controller";

const router = Router();

router.post("/users/get-batch", userController.getUsersByIds);
router.post("/companies/get-batch", companyController.getCompaniesByIds);
router.post("/get-batch-ids", internalController.getBatchIds);

router.get("/users/:userId/feed-context", feedController.getFeedContext);

export default router;
