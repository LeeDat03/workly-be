import { JobHandler } from '@/worker/interface';
import { Queue } from 'bull';
import { AddPostJob } from '@/worker/jobs/add-post.job';


export class Router {
    static async register(): Promise<Queue[]> {
        const queues: JobHandler[] = [];
        queues.push(
            AddPostJob
        );
        return Promise.all(queues.map((queue) => queue.register()));
    }
}
