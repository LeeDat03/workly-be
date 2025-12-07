import { ControllerContainer } from "../container/controller.container";
import { isAuthenticated, optionalAuth } from "../middlewares/authentication.middleware";
import express, { Router } from "express";

export function createSearchRoutes(): Router {
    const router = express.Router();
    const searchController = ControllerContainer.getSearchController();
    router.get("/globalSearch", optionalAuth, searchController.getGlobalSearch);
    router.get("/job", optionalAuth, searchController.getJobSearch)
    router.get("/company", searchController.getCompanySearch)
    router.get("/user", searchController.getUserSearch)
    router.get("/post", searchController.getPostSearch)
    return router;
}
