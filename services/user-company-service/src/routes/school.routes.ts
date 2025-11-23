import { NextFunction, Request, Response, Router } from "express";

import { parsePaginationQuery } from "../utils/pagination";
import { database } from "../config/database";
import { int } from "neo4j-driver";

const router = Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { page, limit, search } = parsePaginationQuery(req.query);
		const neogma = database.getNeogma();

		const offset = (page - 1) * limit;
		// Get extra record to check if there is more data
		const queryLimit = limit + 1;

		const query = search
			? `
				MATCH (u:School)
				WHERE toLower(u.name) CONTAINS toLower($search) OR toLower(u.schoolId) CONTAINS toLower($search)
				RETURN u
				SKIP $offset
				LIMIT $queryLimit
			`
			: `
				MATCH (u:School)
				RETURN u
				SKIP $offset
				LIMIT $queryLimit
			`;

		const result = await neogma.queryRunner.run(query, {
			...(search && { search }),
			offset: int(offset),
			queryLimit: int(queryLimit),
		});

		const schools = result.records.map((record) => {
			const node = record.get("u");
			return node.properties;
		});

		const hasNextPage = schools.length > limit;
		const paginatedSchools = schools.slice(0, limit);

		res.status(200).json({
			success: true,
			data: paginatedSchools,
			pagination: {
				page,
				limit,
				hasNextPage,
			},
		});
	} catch (error) {
		next(error);
	}
});

export default router;
