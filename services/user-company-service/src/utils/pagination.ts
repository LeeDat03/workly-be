import { IPagination } from "../types";

export const parsePaginationQuery = (
	query: any,
	defaultLimit: number = 10,
): IPagination => {
	const page = Number(query.page) || 1;
	const limit = Number(query.limit) || defaultLimit;
	const search = String(query.search || "");

	return {
		page,
		limit,
		search,
	};
};
