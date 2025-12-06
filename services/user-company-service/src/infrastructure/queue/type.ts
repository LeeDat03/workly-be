// ============================================
// QUEUE NAMES - Central place to define all queues
// ============================================
export const QUEUES = {
	USER: "user_queue",
	COMPANY: "company_queue",
	UC_USER: "uc_user_queue", // for update user actions
	UC_COMPANY: "uc_company_queue", // for update company actions
	UC_JOB: "uc_job_queue", // for create/update jobs node in user company service
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

// ============================================
// MESSAGE TYPES
// ============================================
export interface UserMessage {
	userId: string;
	email?: string;
	username?: string;
	action: "created" | "updated" | "deleted";
	timestamp: string;
}

export interface CompanyMessage {
	companyId: string;
	name: string;
	action: "created" | "updated" | "deleted";
	timestamp: string;
}

export interface UC_JobMessage {
	jobId: string;
	companyId: string;
	skills?: string[];
	action: "created" | "updated" | "deleted";
	endDate: string;
}
