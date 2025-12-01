export interface Candidate {
    _id: string;
    jobId: string;
    userId: string;
    name: string;
    email: string;
    cvUrl: string;
    coverLetter: string;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
    note?: string;
}
