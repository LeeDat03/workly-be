import express, { Router } from 'express';
import { createPost, updatePost } from '@/api/validation/post.validatior';
import { validateRequest } from '@/api/middlewares/validate.middleware';
import { ControllerContainer } from '../container/controller.container';
import { UploadMiddleware } from '../middlewares/upload.middleware';

export function createPostRoutes(): Router {
    const router = express.Router()

    const postController = ControllerContainer.getPostController()

    router.post("/create", validateRequest(createPost), postController.createPost)

    router.put("/update/:id", validateRequest(updatePost), postController.updatePost)

    router.post('/uploads', UploadMiddleware.uploadFiles('posts'), postController.uploadFile)

    router.get('/read/:id', postController.getPostDetail)

    // router.get("/video/:filename", postController.getStreamVideo)

    return router;
}