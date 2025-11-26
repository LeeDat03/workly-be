import express, { Router } from "express";
import { createPost } from "@/api/validation/post.validatior";
import { validateRequest } from "@/api/middlewares/validate.middleware";
import { ControllerContainer } from "@/api/container/controller.container";
import { UploadMiddleware } from "@/api/middlewares/upload.middleware";
import {
	createComment,
} from "@/api/validation/comment.validator";
import { isAuthenticated } from "../middlewares/authentication.middleware";

export function createPostRoutes(): Router {
	const router = express.Router();
	router.use(isAuthenticated)
	const postController = ControllerContainer.getPostController();

	router.get("/test", (req, res) => {
		res.send({ a: "abc" });
	});

	router.post(
		"/delete",
		postController.deletePost
	);
	router.post(
		"/create",
		validateRequest(createPost),
		postController.createPost
	);

	router.post(
		"/update",
		postController.updatePost
	);

	router.post(
		"/uploads",
		UploadMiddleware.uploadFiles(),
		postController.uploadFile
	);

	router.get("/read/:id", postController.getPostDetail);

	router.get("/myPost", postController.getPostByUserId);

	router.get("/video/:filename", postController.getStreamVideo);

	const commentController = ControllerContainer.getCommentController();

	router.post(
		"/comment/create",
		validateRequest(createComment),
		commentController.createComment
	);

	router.put(
		"/comment/update",
		commentController.updateComment
	);

	router.get(
		"/comment/list/:postId",
		commentController.getAllComment
	)

	router.get(
		"/comment/:commentId",
		commentController.getCommentById
	)

	//like
	const likeController = ControllerContainer.getLikeController();

	router.post(
		"/like", likeController.likePost
	)

	router.post(
		"/unlike", likeController.unlikePost
	)

	router.get(
		"/like/list", likeController.getAllLikePost
	)

	return router;
}
