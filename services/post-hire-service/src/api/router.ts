import express from "express"
import postRoutes from "@/api/routes/post.routes"

const router = express.Router();

router.use("/", postRoutes)

export default router