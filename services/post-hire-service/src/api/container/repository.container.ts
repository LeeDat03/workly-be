import { IPostRepository, PostRepository } from "@/api/repository/post.repository";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { CommentRepository, ICommentRepository } from "@/api/repository/comment.repository";

export class RepositoryContainer {
    private static postRepository: IPostRepository;
    private static commentRepository: ICommentRepository;

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
}