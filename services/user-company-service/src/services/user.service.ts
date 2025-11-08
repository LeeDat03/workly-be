import { database } from "../config/database";
import { UserModel } from "../models";
import { EducationProperties } from "../models/education.model";
import { IndustryProperties } from "../models/industry.model";
import { SkillProperties } from "../models/skill.model";
import { UserInstance } from "../models/user.model";
import { BadRequestError, NotFoundError } from "../utils/appError";
import { toUserProfileDTO } from "../validators";

/**
 * Update a 1-to-many relationship using Cypher queries.
 *
 * @param userId               – source User.userId
 * @param relationshipName     – Neo4j relationship type (e.g. "HAS_ROLE")
 * @param targetLabel          – label of the target nodes (e.g. "Role")
 * @param targetIdField        – property that holds the business ID (e.g. "roleId")
 * @param newIds               – desired target IDs (undefined = no-op)
 * @param relationshipProps   – optional static props to set on every new rel
 */
export const updateRelationsWithQuery = async (
	userId: string,
	relationshipName: string,
	targetLabel: string,
	targetIdField: string,
	newIds?: string[],
	relationshipProps?: Record<string, unknown>,
): Promise<void> => {
	if (newIds === undefined || newIds === null) return;

	const neogma = database.getNeogma();
	const driver = neogma.driver;
	const session = driver.session();

	try {
		await session.executeWrite(async (tx) => {
			// 1. Validate that *every* newId exists
			if (newIds.length > 0) {
				const checkRes = await tx.run(
					`MATCH (t:${targetLabel})
					WHERE t.${targetIdField} IN $newIds
					RETURN collect(t.${targetIdField}) AS existing`,
					{ newIds },
				);

				const existing: string[] =
					checkRes.records[0]?.get("existing") ?? [];

				const missing = newIds.filter((id) => !existing.includes(id));
				if (missing.length > 0) {
					throw new BadRequestError(
						`${targetLabel}(s) with ${targetIdField}(s) [${missing.join(
							", ",
						)}] do not exist`,
					);
				}
			}

			// 2. Delete *all* existing relationships of this type
			await tx.run(
				`MATCH (u:User {userId: $userId})-[r:${relationshipName}]->(:${targetLabel})
				DELETE r`,
				{ userId },
			);

			// 3. Create the new relationships (MERGE = idempotent)
			if (newIds.length > 0) {
				const setPropsClause = relationshipProps
					? `SET r += $relProps`
					: "";

				await tx.run(
					`
					MATCH (u:User {userId: $userId})
					UNWIND $newIds AS targetId
					MATCH (t:${targetLabel} {${targetIdField}: targetId})
					MERGE (u)-[r:${relationshipName}]->(t)
					${setPropsClause}
					`,
					{
						userId,
						newIds,
						relProps: relationshipProps ?? {},
					},
				);
			}
		});
	} finally {
		await session.close();
	}
};

/**
 * Get the relationships of a user
 * @param user - The user instance
 * @param include - The relationships to include
 * @returns The relationships of the user
 */
export const getUserProfile = async (userId: string, include: string[]) => {
	const user = await UserModel.findOne({ where: { userId } });
	if (!user) {
		throw new NotFoundError("User not found");
	}

	const isInclude = (key: string) => !include || include.includes(key as any);
	const promises = [];

	// ---------- Industry ----------
	if (isInclude("industry")) {
		promises.push(user.findRelationships({ alias: "Industry" }));
	} else {
		promises.push(Promise.resolve([]));
	}

	// ---------- Skill ----------
	if (isInclude("skill")) {
		promises.push(user.findRelationships({ alias: "Skill" }));
	} else {
		promises.push(Promise.resolve([]));
	}

	// ---------- Education ----------
	if (isInclude("education")) {
		promises.push(user.findRelationships({ alias: "Education" }));
	} else {
		promises.push(Promise.resolve([]));
	}

	const [industryRels, skillRels, educationRels] =
		await Promise.all(promises);

	const industryData =
		industryRels.length > 0
			? (industryRels.map(
					(rel) => rel.target.dataValues,
				) as IndustryProperties[])
			: [];
	const skillData =
		skillRels.length > 0
			? (skillRels.map(
					(rel) => rel.target.dataValues,
				) as SkillProperties[])
			: [];
	const educationData =
		educationRels.length > 0
			? (educationRels.map((rel) => rel.target.dataValues) as any)
			: [];

	return toUserProfileDTO(
		user.dataValues,
		industryData,
		skillData,
		educationData,
	);
};
