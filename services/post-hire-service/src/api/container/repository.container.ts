import { IPostRepository, PostRepository } from "@/api/repository/post.repository";
import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";

export class RepositoryContainer {
    private static postRepository: IPostRepository;

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

        this.postRepository = new PostRepository(dbAdapter.post);
        this.isInitialized = true;

        console.log('✅ RepositoryContainer initialized successfully');
    }

    static getPostRepository(): IPostRepository {
        if (!this.isInitialized) {
            throw new Error('❌ RepositoryContainer not initialized. Call initialize() first.');
        }
        return this.postRepository;
    }
}