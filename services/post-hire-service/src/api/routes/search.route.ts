import { ControllerContainer } from "../container/controller.container";
import { isAuthenticated } from "../middlewares/authentication.middleware";
import express, { Router } from "express";

export function createSearchRoutes(): Router {
    const router = express.Router();
    router.use(isAuthenticated)
    const searchController = ControllerContainer.getSearchController();
    router.get("/globalSearch", searchController.getGlobalSearch);
    return router;
}
