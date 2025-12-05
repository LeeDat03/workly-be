import { int } from "neo4j-driver";
import { database } from "../config/database";
import { IPagination } from "../types";
import { toUserBasicDTO } from "../validators";

export const anonymousUserRecommendations = async (pagination: IPagination) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	const queryLimit = limit + 1;
	const neogma = database.getNeogma();

	const query = `
		MATCH (user:User)
		OPTIONAL MATCH (follower:User)-[:FOLLOWING_USER]->(user)
		WITH user, count(follower) AS followerCount
		RETURN user.userId AS userId,
			user.name AS name,
			user.avatarUrl AS avatarUrl,
			user.headline AS headline,
			followerCount
		ORDER BY followerCount DESC
		SKIP $offset
		LIMIT $queryLimit
	`;

	const result = await neogma.queryRunner.run(query, {
		offset: int(offset),
		queryLimit: int(queryLimit),
	});

	const hasNextPage = result.records.length > limit;

	const recommendations = result.records.slice(0, limit).map((record) => {
		return {
			userId: record.get("userId"),
			name: record.get("name"),
			avatarUrl: record.get("avatarUrl"),
			headline: record.get("headline"),
			followerCount: record.get("followerCount").low,
		};
	});

	return {
		recommendations,
		pagination: { page, limit, hasNextPage },
	};
};

export const anonymousCompanyRecommendations = async (
	pagination: IPagination,
) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	const queryLimit = limit + 1;
	const neogma = database.getNeogma();

	const query = `
		MATCH (company:Company)
		OPTIONAL MATCH (follower:User)-[:FOLLOWING_COMPANY]->(company)
		OPTIONAL MATCH (company)-[:IN]->(industry:Industry)
		WITH company, count(follower) AS followerCount, industry.name AS industry
		RETURN company.companyId AS companyId,
			company.name AS name,
			company.logoUrl AS logoUrl,
			followerCount,
			industry
		ORDER BY followerCount DESC
		SKIP $offset
		LIMIT $queryLimit
	`;

	const result = await neogma.queryRunner.run(query, {
		offset: int(offset),
		queryLimit: int(queryLimit),
	});

	const hasNextPage = result.records.length > limit;

	const recommendations = result.records.slice(0, limit).map((record) => {
		return {
			companyId: record.get("companyId"),
			name: record.get("name"),
			logoUrl: record.get("logoUrl"),
			followerCount: record.get("followerCount").low,
			industry: {
				name: record.get("industry"),
			},
		};
	});

	return {
		recommendations,
		pagination: { page, limit, hasNextPage },
	};
};

/**
 * Mutual friends: score=10
 * Common things: score=1
 */
export const userRecommendations = async (
	userId: string,
	pagination: IPagination,
) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	const queryLimit = limit + 1;

	const neogma = database.getNeogma();
	const query = `
        MATCH (me:User {userId: $userId})

        MATCH (candidate:User)
        WHERE candidate.userId <> me.userId
        AND NOT (me)-[:FOLLOWING_USER]->(candidate)

        OPTIONAL MATCH (me)-[:FOLLOWING_USER]->(friend:User)-[:FOLLOWING_USER]->(candidate)
        WITH me, candidate, count(DISTINCT friend) AS mutualFriends

        OPTIONAL MATCH (me)-[:WORKS_AT|ATTEND_SCHOOL|IN_INDUSTRY]-(commonThing)-[:WORKS_AT|ATTEND_SCHOOL|IN_INDUSTRY]-(candidate)
        WITH me, candidate, 
            mutualFriends,
            count(DISTINCT commonThing) AS commonThings

        WITH me, candidate,
            mutualFriends,
            commonThings,
            (mutualFriends * 10) + (commonThings * 1) AS finalScore,
            CASE WHEN (mutualFriends * 10) + (commonThings * 1) > 0 THEN 0 ELSE 1 END AS zeroPriority

        WHERE NOT (me)-[:FOLLOWING_USER]->(candidate)

        RETURN candidate.userId AS userId,
            candidate.name AS name,
            candidate.avatarUrl AS avatarUrl,
            candidate.headline AS headline,
            finalScore,
            mutualFriends,
            commonThings
        ORDER BY zeroPriority ASC, finalScore DESC, mutualFriends DESC
        SKIP $offset
        LIMIT $queryLimit
    `;
	const result = await neogma.queryRunner.run(query, {
		userId,
		offset: int(offset),
		queryLimit: int(queryLimit),
	});

	const hasNextPage = result.records.length > limit;

	const recommendations = result.records.map((record) => {
		return {
			userId: record.get("userId"),
			name: record.get("name"),
			avatarUrl: record.get("avatarUrl"),
			headline: record.get("headline"),
			finalScore: record.get("finalScore").low,
		};
	});
	return {
		recommendations,
		pagination: { page, limit, hasNextPage },
	};
};

export const companyRecommendations = async (
	userId: string,
	pagination: IPagination,
) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	const queryLimit = limit + 1;

	const neogma = database.getNeogma();

	const query = `
		MATCH (me:User {userId: $userId})
		MATCH (company:Company)
		WHERE NOT (me)-[:FOLLOWING_COMPANY]->(company)

		OPTIONAL MATCH (me)-[:IN_INDUSTRY]->(industry)<-[:IN]-(company)
		WITH company, count(DISTINCT industry) AS commonIndustries

		OPTIONAL MATCH (follower:User)-[:FOLLOWING_COMPANY]->(company)
		OPTIONAL MATCH (company)-[:IN]->(companyIndustry:Industry)
		WITH company, 
			commonIndustries,
			count(follower) AS followerCount,
			companyIndustry.name AS industry,
			CASE WHEN commonIndustries > 0 THEN 0 ELSE 1 END AS zeroPriority

		RETURN company.companyId AS companyId,
			company.name AS name,
			company.logoUrl AS logoUrl,
			company.websiteUrl AS websiteUrl,
			company.description AS description,
			followerCount,
			commonIndustries,
			industry
		ORDER BY zeroPriority ASC, followerCount DESC, commonIndustries DESC
		SKIP $offset
		LIMIT $queryLimit
	`;

	const result = await neogma.queryRunner.run(query, {
		userId,
		offset: int(offset),
		queryLimit: int(queryLimit),
	});

	const hasNextPage = result.records.length > limit;

	const recommendations = result.records.slice(0, limit).map((record) => {
		return {
			companyId: record.get("companyId"),
			name: record.get("name"),
			logoUrl: record.get("logoUrl"),
			websiteUrl: record.get("websiteUrl"),
			description: record.get("description"),
			followerCount: record.get("followerCount").low,
			industry: {
				name: record.get("industry"),
			},
		};
	});

	return {
		recommendations,
		pagination: { page, limit, hasNextPage },
	};
};
