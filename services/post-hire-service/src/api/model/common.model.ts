import { ObjectId } from "mongodb";

export interface IPaginationInput {
	page?: number;
	size?: number;
	startIndex?: number;
	sortField?: string;
	sortOrder?: number; //0: asc, 1: desc
	startAt?: DateString;
	endAt?: DateString;
}

export interface PaginationInfo {
	page: number;
	size: number;
	total: number;
	totalPages: number;
}

export interface PagingList<T> {
	data: T[];
	pagination: PaginationInfo;
}

export interface JobPost {
	postId: ObjectId;
}
