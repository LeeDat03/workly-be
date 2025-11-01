import express, { Router } from 'express';
import { createPost } from '@/api/validation/post.validatior';
import { validateRequest } from '@/api/middlewares/validate.middleware';
import { ControllerContainer } from '../container/controller.container';

export function createPostRoutes(): Router {
    const router = express.Router()

    const postController = ControllerContainer.getPostController()
    router.post("/create", validateRequest(createPost), postController.createPost)

    return router;
}