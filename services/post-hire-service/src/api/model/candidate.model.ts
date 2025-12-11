export interface Candidate {
    _id: string;
    jobId: string;
    jobInfo?: any;
    userId: string;
    name: string;
    email: string;
    cvUrl: string;
    coverLetter: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    note?: string;
}
