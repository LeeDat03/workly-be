export interface Job {
    _id: string;
    id: string;
    title: string;
    content: string;
    industry: string;
    salary: string;
    location: string;
    jobType: string;
    skills: string[];
    companyId: string;
    status: boolean;
    isApplied?: boolean;
}

export type GetPostJobDetailInput = {
    jobId: string;
    companyId: string;
};