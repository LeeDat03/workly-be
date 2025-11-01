import { PostController } from "@/api/controller/post.controller";
import { ServiceContainer } from "./service.container";

export class ControllerContainer {
    private static postController: PostController;
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
        this.isInitialized = true;

        console.log('✅ ControllerContainer initialized successfully');
    }
    static getPostController(): PostController {
        if (!this.postController) {
            this.postController = new PostController(ServiceContainer.getPostService());
        }
        return this.postController;
    }
}