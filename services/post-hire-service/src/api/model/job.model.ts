export interface Job {
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
}

export type GetPostJobDetailInput = {
    jobId: string;
    companyId: string;
};