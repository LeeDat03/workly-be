import express, { Router } from "express";


export function createFeedRoutes(): Router {
    const router = express.Router();

    router.get("/test", (req, res) => {
        res.send({ a: "abc" });
    });

    return router;
}
