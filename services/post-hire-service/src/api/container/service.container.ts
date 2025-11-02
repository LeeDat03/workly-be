import { IPostService, PostService } from "@/api/service/post.service";
import { RepositoryContainer } from "@/api/container/repository.container";
import { CommentService, ICommentService } from "@/api/service/comment.service";

export class ServiceContainer {
    private static postService: IPostService;
    private static commentService: ICommentService;
    private static isInitialized = false;

    static async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️  ServiceContainer already initialized');
            return;
        }

        console.log('🔧 Initializing ServiceContainer...');

        this.postService = new PostService(
            RepositoryContainer.getPostRepository()
        );
        this.commentService = new CommentService(
            RepositoryContainer.getCommentRepository(),
            RepositoryContainer.getPostRepository()
        )
        this.isInitialized = true;

        console.log('✅ ServiceContainer initialized successfully');
    }

    static getPostService(): IPostService {
        if (!this.postService) {
            this.postService = new PostService(RepositoryContainer.getPostRepository());
        }
        return this.postService;
    }

    static getCommentService(): ICommentService {
        if (!this.commentService) {
            this.commentService = new CommentService(RepositoryContainer.getCommentRepository(), RepositoryContainer.getPostRepository());
        }
        return this.commentService;
    }
}