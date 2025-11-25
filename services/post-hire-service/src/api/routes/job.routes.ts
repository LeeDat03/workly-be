import express, { Router } from "express";
import { isAuthenticated } from "../middlewares/authentication.middleware";
import { ControllerContainer } from "../container/controller.container";


export function createJobRoutes(): Router {

    const router = express.Router();
    const jobController = ControllerContainer.getJobController();
    router.use(isAuthenticated)

    router.get("/test", (req, res) => {
        res.send({ a: "abc" });
    });

    router.get("/myJob", jobController.getJobsByCompanyId);
    router.post("/create", jobController.createJobPost);
    router.delete("/delete", jobController.deleteJobPost);
    router.get("/detail", jobController.getPostJobDetail);
    router.post("/update", jobController.updateCompanyJob);

    return router;
}
