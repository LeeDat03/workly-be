import { ObjectId } from "mongodb";

export interface IPaginationInput {
	page?: number;
	size?: number;
	startIndex?: number;
	sortField?: string;
	sortOrder?: number; //0: asc, 1: desc
	startAt?: string;
	endAt?: string;
}

export interface PostSearch extends IPaginationInput {
	author_type?: string;
}

export interface JobSearch extends IPaginationInput {
	skills: string;
	industries: string;
	search: string;
	searchType: string;
	jobType: string;
	companyId: string;
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
