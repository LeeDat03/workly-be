import { int } from "neo4j-driver";
import { database } from "../config/database";
import { IPagination } from "../types";
import { NotFoundError } from "../utils/appError";
import { toUserBasicDTO, toUserFollowDTO } from "../validators/user.validator";

//////////////////////////////////////////////////////////////////
// USER
export const followUser = async (currId: string, targetId: string) => {
	const neogma = database.getNeogma();

	const result = await neogma.queryRunner.run(
		`
		OPTIONAL MATCH (u1:User {userId: $currId})
		OPTIONAL MATCH (u2:User {userId: $targetId})
		RETURN u1, u2
		`,
		{ currId, targetId },
	);

	const record = result.records[0];
	if (!record.get("u1")) {
		throw new NotFoundError("User not found");
	}
	if (!record.get("u2")) {
		throw new NotFoundError("Target user not found");
	}

	await neogma.queryRunner.run(
		`
		MATCH (u1:User {userId: $currId})
		MATCH (u2:User {userId: $targetId})
		MERGE (u1)-[r:FOLLOWING_USER]->(u2)
		ON CREATE SET r.timestamp = datetime()
		RETURN r
		`,
		{ currId, targetId },
	);
};

export const unfollowUser = async (currId: string, targetId: string) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u1:User {userId: $currId})-[r:FOLLOWING_USER]->(u2:User {userId: $targetId})
		DELETE r
		RETURN count(r) as deletedCount
		`,
		{ currId, targetId },
	);

	const deletedCount =
		result.records[0]?.get("deletedCount")?.toNumber() || 0;
	// if (deletedCount === 0) {
	// 	throw new NotFoundError("Follow relationship not found");
	// }
};

export const getUserFollowers = async (
	userId: string,
	pagination: IPagination,
) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	// Get extra record to check if there is more data
	const queryLimit = limit + 1;

	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User)-[r:FOLLOWING_USER]->(f:User {userId: $userId})
		RETURN u, r
		ORDER BY r.timestamp DESC
		SKIP $offset
		LIMIT $queryLimit
		`,
		{
			userId,
			offset: int(offset),
			queryLimit: int(queryLimit),
		},
	);
	const hasNextPage = result.records.length > limit;

	const followers = result.records.slice(0, limit).map((record) => {
		const userNode = record.get("u");
		const relationship = record.get("r");

		const user = toUserBasicDTO(userNode.properties);
		return {
			...user,
			followedAt: new Date(relationship.properties.timestamp),
		};
	});

	return {
		followers: followers,
		pagination: { page, limit, hasNextPage },
	};
};

export const getUserFollowing = async (
	userId: string,
	pagination: IPagination,
) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	// Get extra record to check if there is more data
	const queryLimit = limit + 1;

	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User {userId: $userId})-[r:FOLLOWING_USER]->(f:User)
		RETURN f, r
		ORDER BY r.timestamp DESC
		SKIP $offset
		LIMIT $queryLimit
		`,
		{ userId, offset: int(offset), queryLimit: int(queryLimit) },
	);
	const hasNextPage = result.records.length > limit;

	const following = result.records.slice(0, limit).map((record) => {
		const userNode = record.get("f");
		const relationship = record.get("r");
		const user = toUserBasicDTO(userNode.properties);
		return {
			...user,
			followedAt: new Date(relationship.properties.timestamp),
		};
	});

	return {
		following: following,
		pagination: { page, limit, hasNextPage },
	};
};

export const countUserFollowers = async (userId: string) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User)-[r:FOLLOWING_USER]->(f:User {userId: $userId})
		RETURN count(r) as count
		`,
		{ userId },
	);
	return result.records[0]?.get("count")?.toNumber() || 0;
};

export const countUserFollowing = async (userId: string) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User {userId: $userId})-[r:FOLLOWING_USER]->(f:User)
		RETURN count(r) as count
		`,
		{ userId },
	);
	return result.records[0]?.get("count")?.toNumber() || 0;
};

export const checkIfUserFollowsUser = async (
	userId: string,
	targetId: string,
) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User {userId: $userId})-[r:FOLLOWING_USER]->(t:User {userId: $targetId})
		RETURN r
		`,
		{ userId, targetId },
	);
	return result.records.length > 0;
};

////////////////////////////////////////////////////////////////////
// COMPANY
export const followCompany = async (userId: string, companyId: string) => {
	const neogma = database.getNeogma();

	const result = await neogma.queryRunner.run(
		`
		OPTIONAL MATCH (u:User {userId: $userId})
		OPTIONAL MATCH (c:Company {companyId: $companyId})
		RETURN u, c
		`,
		{ userId, companyId },
	);

	const record = result.records[0];
	if (!record.get("u")) {
		throw new NotFoundError("User not found");
	}
	if (!record.get("c")) {
		throw new NotFoundError("Company not found");
	}

	await neogma.queryRunner.run(
		`
		MATCH (u:User {userId: $userId})
		MATCH (c:Company {companyId: $companyId})
		MERGE (u)-[r:FOLLOWING_COMPANY]->(c)
		ON CREATE SET r.timestamp = datetime()
		RETURN r
		`,
		{ userId, companyId },
	);
};

export const unfollowCompany = async (userId: string, companyId: string) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User {userId: $userId})-[r:FOLLOWING_COMPANY]->(c:Company {companyId: $companyId})
		DELETE r
		RETURN count(r) as deletedCount
		`,
		{ userId, companyId },
	);

	const deletedCount =
		result.records[0]?.get("deletedCount")?.toNumber() || 0;
	// if (deletedCount === 0) {
	// 	throw new NotFoundError("Follow relationship not found");
	// }
};

export const getCompanyFollowers = async (
	companyId: string,
	pagination: IPagination,
) => {
	const { page, limit } = pagination;
	const offset = (page - 1) * limit;
	// Get extra record to check if there is more data
	const queryLimit = limit + 1;

	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User)-[r:FOLLOWING_COMPANY]->(c:Company {companyId: $companyId})
		RETURN u, r
		ORDER BY r.timestamp DESC
		SKIP $offset
		LIMIT $queryLimit
		`,
		{ companyId, offset: int(offset), queryLimit: int(queryLimit) },
	);
	const hasNextPage = result.records.length > limit;

	const followers = result.records.slice(0, limit).map((record) => {
		const userNode = record.get("u");
		const relationship = record.get("r");
		const user = toUserFollowDTO(userNode.properties);
		return {
			...user,
			followedAt: new Date(relationship.properties.timestamp),
		};
	});

	return {
		followers: followers,
		pagination: { page, limit, hasNextPage },
	};
};

export const countCompanyFollowers = async (companyId: string) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User)-[r:FOLLOWING_COMPANY]->(c:Company {companyId: $companyId})
		RETURN count(r) as count
		`,
		{ companyId },
	);
	return result.records[0]?.get("count")?.toNumber() || 0;
};

export const checkIfUserFollowsCompany = async (
	userId: string,
	companyId: string,
) => {
	const neogma = database.getNeogma();
	const result = await neogma.queryRunner.run(
		`
		MATCH (u:User {userId: $userId})-[r:FOLLOWING_COMPANY]->(c:Company {companyId: $companyId})
		RETURN r
		`,
		{ userId, companyId },
	);
	return result.records.length > 0;
};
