import { NextFunction, Request, Response } from "express";
import { database } from "../config/database";
import { BadRequestError } from "../utils/appError";
import { int } from "neo4j-driver";

/**
 * Get the feed context for a user
 * 1. Company + User I follow: score=100
 * 2. Coworkers & schoolmates: score=30
 * 3. Industry peers: score=10
 * 4. Skill peers: score=5
 */
// TODO: cache this
const getFeedContext = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { userId } = req.params;
		if (!userId) {
			throw new BadRequestError("User ID is required");
		}

		const neogma = database.getNeogma();

		const query = `
            MATCH (u:User {userId: $userId})
            CALL {
                WITH u
                MATCH (u)-[:FOLLOWING_USER]->(target:User)
                RETURN target, 'user' AS type, 100 AS score
                LIMIT 200

                UNION ALL
                WITH u
                MATCH (u)-[:FOLLOWING_COMPANY]->(target:Company)
                RETURN target, 'company' AS type, 100 AS score
                LIMIT 200

                UNION ALL
                WITH u
                MATCH (u)-[:WORKS_AT]->(target:Company)<-[:WORKS_AT]-(peer:User)
                WHERE peer.userId <> $userId
                RETURN peer as target, 'user' AS type, 30 AS score
                LIMIT 50

                UNION ALL
                WITH u
                MATCH (u)-[:ATTEND_SCHOOL]->(target:School)<-[:ATTEND_SCHOOL]-(peer:User)
                WHERE peer.userId <> $userId
                RETURN peer as target, 'user' AS type, 20 AS score
                LIMIT 50

                UNION ALL
                WITH u
                MATCH (u)-[:IN_INDUSTRY]->(target:Industry)<-[:IN_INDUSTRY]-(peer:User)
                WHERE peer.userId <> $userId
                RETURN peer as target, 'user' AS type, 10 AS score
                LIMIT 5

                UNION ALL
                WITH u
                MATCH (u)-[:HAS_SKILL]->(target:Skill)<-[:HAS_SKILL]-(peer:User)
                WHERE peer.userId <> $userId
                WITH peer, count(*) AS sharedSkills
                RETURN peer as target, 'user' AS type,
                       CASE WHEN sharedSkills >= 5 THEN 5 ELSE sharedSkills END AS score
                LIMIT 5
            }
            WITH target, type, SUM(score) AS totalScore
            RETURN target, type, totalScore
            ORDER BY totalScore DESC
            LIMIT $limit
        `;

		const result = await neogma.queryRunner.run(query, {
			userId,
			limit: int(200),
		});

		const feedContext = result.records.map((record) => ({
			target: record.get("target").properties,
			type: record.get("type"),
			score: Number(record.get("totalScore")),
		}));

		const response = feedContext.map((item) => {
			if (item.type === "user") {
				return {
					target: {
						id: item.target.userId,
						name: item.target.name,
						imageUrl: item.target.avatarUrl,
						headline: item.target.headline,
					},
					type: item.type,
					score: item.score,
				};
			} else {
				return {
					target: {
						id: item.target.companyId,
						name: item.target.name,
						imageUrl: item.target.logoUrl,
					},
					type: item.type,
					score: item.score,
				};
			}
		});

		return res.status(200).json({
			success: true,
			data: response,
		});
	} catch (error) {
		next(error);
	}
};

const getJobContext = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { userId } = req.params;
		const page = Number(req.query.page) || 1;
		const size = Number(req.query.size) || 10;

		if (!userId) {
			throw new BadRequestError("User ID is required");
		}

		const skip = (page - 1) * size;
		const limit = size + 1;

		const neogma = database.getNeogma();

		const query = `
		MATCH (u:User {userId: $userId})

		MATCH (j:Job)-[:POSTED_BY]->(c:Company)
		WHERE j.endDate >= date()

		WITH u, j, c,
			CASE WHEN EXISTS { MATCH (u)-[:FOLLOWING_COMPANY]->(c) } THEN 10 ELSE 0 END AS followScore

		OPTIONAL MATCH (u)-[:HAS_SKILL]->(:Skill)<-[:REQUIRED_SKILL]-(j)
		WITH j, c, followScore, count(*) AS matchingSkills

		WITH j, c, followScore + matchingSkills AS totalScore
		RETURN j.jobId AS jobId, c, totalScore
		ORDER BY totalScore DESC
		SKIP $skip
		LIMIT $limit
	`;

		const result = await neogma.queryRunner.run(query, {
			userId,
			skip: int(skip),
			limit: int(limit),
		});

		const hasNextPage = result.records.length > limit;
		const jobs = result.records.slice(0, limit).map((record) => {
			const company = record.get("c").properties;
			return {
				jobId: record.get("jobId"),
				company: {
					id: company.companyId,
					name: company.name,
					imageUrl: company.logoUrl,
				},
				score: Number(record.get("totalScore")),
			};
		});

		return res.status(200).json({
			success: true,
			data: jobs,
			pagination: {
				page,
				limit: limit - 1,
				hasNextPage,
			},
		});
	} catch (error) {
		next(error);
	}
};

export default {
	getFeedContext,
	getJobContext,
};
