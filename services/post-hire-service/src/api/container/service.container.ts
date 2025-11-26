import { IPostService, PostService } from "@/api/service/post.service";
import { RepositoryContainer } from "@/api/container/repository.container";
import { CommentService, ICommentService } from "@/api/service/comment.service";
import { ILikeService, LikeService } from "../service/like.service";
import { IJobService, JobService } from "../service/job.service";

export class ServiceContainer {
    private static postService: IPostService;
    private static commentService: ICommentService;
    private static likeService: ILikeService;
    private static jobService: IJobService;
    private static isInitialized = false;

    static async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️  ServiceContainer already initialized');
            return;
        }

        console.log('🔧 Initializing ServiceContainer...');

        this.postService = new PostService(
            RepositoryContainer.getPostRepository(),
            RepositoryContainer.getCommentRepository(),
            RepositoryContainer.getLikeRepository()
        );
        this.commentService = new CommentService(
            RepositoryContainer.getCommentRepository(),
            RepositoryContainer.getPostRepository(),
            RepositoryContainer.getLikeRepository()
        )
        this.likeService = new LikeService(
            RepositoryContainer.getLikeRepository()
        )
        this.jobService = new JobService(
            RepositoryContainer.getJobRepository()
        )
        this.isInitialized = true;

        console.log('✅ ServiceContainer initialized successfully');
    }

    static getPostService(): IPostService {
        if (!this.postService) {
            this.postService = new PostService(RepositoryContainer.getPostRepository(), RepositoryContainer.getCommentRepository(), RepositoryContainer.getLikeRepository());
        }
        return this.postService;
    }

    static getCommentService(): ICommentService {
        if (!this.commentService) {
            this.commentService = new CommentService(RepositoryContainer.getCommentRepository(), RepositoryContainer.getPostRepository(), RepositoryContainer.getLikeRepository()
            );
        }
        return this.commentService;
    }
    static getLikeService(): ILikeService {
        if (!this.likeService) {
            this.likeService = new LikeService(RepositoryContainer.getLikeRepository());
        }
        return this.likeService;
    }
    static getJobService(): IJobService {
        if (!this.jobService) {
            this.jobService = new JobService(RepositoryContainer.getJobRepository());
        }
        return this.jobService;
    }
}