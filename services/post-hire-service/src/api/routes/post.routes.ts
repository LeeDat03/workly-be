import express, { Router } from "express";
import { createPost, updatePost } from "@/api/validation/post.validatior";
import { validateRequest } from "@/api/middlewares/validate.middleware";
import { ControllerContainer } from "@/api/container/controller.container";
import { UploadMiddleware } from "@/api/middlewares/upload.middleware";
import {
	createComment,
	updateComment,
} from "@/api/validation/comment.validator";
import { log } from "console";

export function createPostRoutes(): Router {
	const router = express.Router();

	const postController = ControllerContainer.getPostController();

	router.get("/test", (req, res) => {
		console.log(req);
		res.send({ a: "abc" });
	});

	router.post(
		"/create",
		validateRequest(createPost),
		postController.createPost
	);

	router.put(
		"/update/:id",
		validateRequest(updatePost),
		postController.updatePost
	);

	router.post(
		"/uploads",
		UploadMiddleware.uploadFiles(),
		postController.uploadFile
	);

	router.get("/read/:id", postController.getPostDetail);

	router.get("/", postController.getAll);

	router.get("/video/:filename", postController.getStreamVideo);

	const commentController = ControllerContainer.getCommentController();

	router.post(
		"/comment/create",
		validateRequest(createComment),
		commentController.createComment
	);

	router.put(
		"/comment/update/:id",
		validateRequest(updateComment),
		commentController.updateComment
	);

	return router;
}
