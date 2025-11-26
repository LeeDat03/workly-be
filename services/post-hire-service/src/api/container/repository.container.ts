import { IPostRepository, PostRepository } from "@/api/repository/post.repository";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { CommentRepository, ICommentRepository } from "@/api/repository/comment.repository";
import { ILikeRepository, likeRepository } from "../repository/like.repository";
import { IJobRepository, JobRepository } from "../repository/job.repository";

export class RepositoryContainer {
    private static postRepository: IPostRepository;
    private static commentRepository: ICommentRepository;
    private static likeRepository: ILikeRepository;
    private static jobRepository: IJobRepository

    private static isInitialized = false;

    static async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.log('⚠️  RepositoryContainer already initialized');
            return;
        }

        console.log('🔧 Initializing RepositoryContainer...');
        const dbAdapter = DatabaseAdapter.getInstance();

        if (!dbAdapter.isConnected()) {
            throw new Error('❌ Database must be connected before initializing repositories');
        }

        this.postRepository = new PostRepository(dbAdapter);
        this.commentRepository = new CommentRepository(dbAdapter);
        this.likeRepository = new likeRepository(dbAdapter)
        this.jobRepository = new JobRepository(dbAdapter)
        this.isInitialized = true;

        console.log('✅ RepositoryContainer initialized successfully');
    }

    static getPostRepository(): IPostRepository {
        if (!this.isInitialized) {
            throw new Error('❌ RepositoryContainer not initialized. Call initialize() first.');
        }
        return this.postRepository;
    }
    static getCommentRepository(): ICommentRepository {
        if (!this.isInitialized) {
            throw new Error('❌ RepositoryContainer not initialized. Call initialize() first.');
        }
        return this.commentRepository;
    }

    static getLikeRepository(): ILikeRepository {
        if (!this.isInitialized) {
            throw new Error('❌ RepositoryContainer not initialized. Call initialize() first.');
        }
        return this.likeRepository;
    }
    static getJobRepository(): IJobRepository {
        if (!this.isInitialized) {
            throw new Error('❌ RepositoryContainer not initialized. Call initialize() first.');
        }
        return this.jobRepository;
    }
}