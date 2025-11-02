import { PostController } from "@/api/controller/post.controller";
import { ServiceContainer } from "@/api/container/service.container";
import { CommentController } from "@/api/controller/comment.controller";

export class ControllerContainer {
    private static postController: PostController;
    private static commentController: CommentController
    private static isInitialized = false;

    static async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️  ControllerContainer already initialized');
            return;
        }

        console.log('🔧 Initializing ControllerContainer...');

        this.postController = new PostController(
            ServiceContainer.getPostService()
        );
        this.commentController = new CommentController(
            ServiceContainer.getCommentService()
        )
        this.isInitialized = true;

        console.log('✅ ControllerContainer initialized successfully');
    }
    static getPostController(): PostController {
        if (!this.postController) {
            this.postController = new PostController(ServiceContainer.getPostService());
        }
        return this.postController;
    }

    static getCommentController(): CommentController {
        if (!this.commentController) {
            this.commentController = new CommentController(ServiceContainer.getCommentService());
        }
        return this.commentController;
    }
}