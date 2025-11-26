import { Job, DoneCallback, Queue } from 'bull';

export interface JobHandler {
    register(): Promise<Queue>;
    handler(job: Job, done: DoneCallback): Promise<void>;
}

export interface RefreshJobData {
    job?: string;
    command: string;
}
