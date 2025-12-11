import express, { Router } from "express";
import { isAuthenticated, optionalAuth } from "../middlewares/authentication.middleware";
import { ControllerContainer } from "../container/controller.container";


export function createJobRoutes(): Router {

    const router = express.Router();
    const jobController = ControllerContainer.getJobController();
    router.get("/myJob", optionalAuth, jobController.getJobsByCompanyId);

    router.use(isAuthenticated)

    router.get("/test", (req, res) => {
        res.send({ a: "abc" });
    });

    router.post("/create", jobController.createJobPost);
    router.delete("/delete", jobController.deleteJobPost);
    router.get("/detail", jobController.getPostJobDetail);
    router.post("/update", jobController.updateCompanyJob);
    router.get("/status", jobController.getPostJobByStatus);
    router.post("/apply", jobController.applyJob);
    router.get("/candidates", jobController.getCandidateByStatus);
    router.post("/feedback", jobController.feedbackCandidate);
    router.get("/applications", jobController.getAppliedJobs);

    return router;
}
