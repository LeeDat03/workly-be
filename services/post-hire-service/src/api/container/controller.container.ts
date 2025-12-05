import { PostController } from "@/api/controller/post.controller";
import { ServiceContainer } from "@/api/container/service.container";
import { CommentController } from "@/api/controller/comment.controller";
import { LikeController } from "../controller/like.controller";
import { FeedController } from "../controller/feed.controller";
import { RepositoryContainer } from "@/api/container/repository.container";
import { JobController } from "../controller/job.controller";
import { SearchController } from "../controller/search.controller";

export class ControllerContainer {
	private static postController: PostController;
	private static commentController: CommentController;
	private static likeController: LikeController;
	private static jobController: JobController;
	private static feedController: FeedController;
	private static searchController: SearchController;
	private static isInitialized = false;

	static async initialize(): Promise<void> {
		if (this.isInitialized) {
			console.log("⚠️  ControllerContainer already initialized");
			return;
		}

		console.log("🔧 Initializing ControllerContainer...");

		this.postController = new PostController(
			ServiceContainer.getPostService()
		);
		this.commentController = new CommentController(
			ServiceContainer.getCommentService()
		);
		this.likeController = new LikeController(
			ServiceContainer.getLikeService()
		);
		this.jobController = new JobController(
			ServiceContainer.getJobService()
		);
		this.feedController = new FeedController(
			ServiceContainer.getPostService(),
			ServiceContainer.getJobService()
		);
		this.searchController = new SearchController(
			ServiceContainer.getSearchService()
		)
		this.isInitialized = true;

		console.log("✅ ControllerContainer initialized successfully");
	}

	static getSearchController(): SearchController {
		if (!this.searchController) {
			this.searchController = new SearchController(
				ServiceContainer.getSearchService()
			);
		}
		return this.searchController;
	}

	static getPostController(): PostController {
		if (!this.postController) {
			this.postController = new PostController(
				ServiceContainer.getPostService()
			);
		}
		return this.postController;
	}

	static getCommentController(): CommentController {
		if (!this.commentController) {
			this.commentController = new CommentController(
				ServiceContainer.getCommentService()
			);
		}
		return this.commentController;
	}

	static getLikeController(): LikeController {
		if (!this.likeController) {
			this.likeController = new LikeController(
				ServiceContainer.getLikeService()
			);
		}
		return this.likeController;
	}
	static getJobController(): JobController {
		if (!this.jobController) {
			this.jobController = new JobController(
				ServiceContainer.getJobService()
			);
		}
		return this.jobController;
	}

	static getFeedController(): FeedController {
		if (!this.feedController) {
			this.feedController = new FeedController(
				ServiceContainer.getPostService(),
				ServiceContainer.getJobService()
			);
		}
		return this.feedController;
	}
}
