import { JobPost } from "@/api/model/common.model";
import { QueueService } from "@/api/service/queue.service";
import logger from "@/common/logger";
import { ADD_POST_JOB as JOB_NAME } from "@/config/job.constant";
import { DoneCallback, Job, Queue } from "bull";

export class AddPostJob {
	static async register(): Promise<Queue<unknown>> {
		logger.info(`Listening to queue: ${JOB_NAME}`);
		const queue = await QueueService.getQueue<JobPost>(JOB_NAME);
		await queue.process(this.handler);
		return queue;
	}

	public static async handler(
		job: Job<any>,
		done: DoneCallback
	): Promise<void> {
		try {
			logger.debug(
				`Process job ${JOB_NAME}-${job.id} with data: `,
				job.data
			);
			//rank post
			//get list user friend
			//save into user_post
			//push into timeline of friend
			logger.debug(`Processed job ${JOB_NAME}-${job.id}`);
		} catch (error) {
			logger.error(`Process ${JOB_NAME} error: `, error);
		}
	}
}
