import { database } from "../config/database";
import { UserModel } from "../models";
import { IndustryProperties } from "../models/industry.model";
import { SkillProperties } from "../models/skill.model";
import { BadRequestError, NotFoundError } from "../utils/appError";
import { UNLISTED_COMPANY } from "../utils/constants";
import { toUserProfileDTO } from "../validators";

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

	// ---------- Location ----------
	if (isInclude("location")) {
		promises.push(user.findRelationships({ alias: "Location" }));
	} else {
		promises.push(Promise.resolve([]));
	}

	const [industryRels, skillRels, educationRels, locationRels] =
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
			? educationRels
					.map((rel) => {
						return {
							...rel.target.dataValues,
							...rel.relationship,
						};
					})
					.sort((a, b) => {
						return (
							new Date(a.startDate!).getTime() -
							new Date(b.startDate!).getTime()
						);
					})
			: [];
	const locationData =
		locationRels.length > 0 ? locationRels[0].target.dataValues : null;

	return toUserProfileDTO(
		user.dataValues,
		industryData,
		skillData,
		educationData,
		locationData,
	);
};

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
	targetLabel: "Industry" | "Skill" | "Company" | "School" | "Location",
	targetIdField:
		| "industryId"
		| "skillId"
		| "companyId"
		| "schoolId"
		| "locationId",
	newIds?: string[],
	relationshipProps?: Array<Record<string, unknown>>,
): Promise<void> => {
	if (newIds === undefined || newIds === null) return;

	const neogma = database.getNeogma();
	const driver = neogma.driver;
	const session = driver.session();

	const unlistedConfig: Record<
		string,
		{ idField: string; nameField: string }
	> = {
		Company: { idField: "companyId", nameField: "companyName" },
		School: { idField: "schoolId", nameField: "schoolName" },
	};

	const supportsUnlisted = targetLabel in unlistedConfig;

	try {
		await session.executeWrite(async (tx) => {
			// 1. Validate that each newId exists
			if (newIds.length > 0) {
				const idsToValidate = supportsUnlisted
					? newIds.filter((id) => id !== UNLISTED_COMPANY.companyId)
					: newIds;

				if (idsToValidate.length > 0) {
					const checkRes = await tx.run(
						`MATCH (t:${targetLabel})
					WHERE t.${targetIdField} IN $newIds
					RETURN collect(t.${targetIdField}) AS existing`,
						{ newIds },
					);

					const existing: string[] =
						checkRes.records[0]?.get("existing") ?? [];

					const missing = idsToValidate.filter(
						(id) => !existing.includes(id),
					);
					if (missing.length > 0) {
						throw new BadRequestError(
							`${targetLabel}(s) with ${targetIdField}(s) [${missing.join(
								", ",
							)}] do not exist`,
						);
					}
				}
			}

			// 2. Delete existing relationships of this type
			await tx.run(
				`MATCH (u:User {userId: $userId})-[r:${relationshipName}]->(:${targetLabel})
				DELETE r`,
				{ userId },
			);

			// 3. Create the new relationships
			if (newIds.length > 0) {
				const isMerge =
					targetLabel !== "School" && targetLabel !== "Company";
				const mergeClause = isMerge ? "MERGE" : "CREATE";

				const items = newIds.map((id, idx) => ({
					targetId: id,
					props: relationshipProps?.[idx] ?? {},
					isUnlisted:
						supportsUnlisted && id === UNLISTED_COMPANY.companyId,
				}));

				const regularItems = items.filter((item) => !item.isUnlisted);
				const unlistedItems = items.filter((item) => item.isUnlisted);

				// Create regular relationships
				if (regularItems.length > 0) {
					await tx.run(
						`
					  MATCH (u:User {userId: $userId})
					  UNWIND $items AS item
					  MATCH (t:${targetLabel} {${targetIdField}: item.targetId})
					  ${mergeClause} (u)-[r:${relationshipName}]->(t)
					  SET r += item.props
					  `,
						{ userId, items: regularItems },
					);
				}

				// Create UNLISTED relationships with name stored on relationship
				if (unlistedItems.length > 0) {
					await tx.run(
						`
					  MATCH (u:User {userId: $userId})
					  MERGE (unlisted:${targetLabel} {${targetIdField}: $unlistedId, name: 'Other'})
					  WITH u, unlisted
					  UNWIND $items AS item
					  CREATE (u)-[r:${relationshipName}]->(unlisted)
					  SET r += item.props
					  `,
						{
							userId,
							items: unlistedItems,
							unlistedId: UNLISTED_COMPANY.companyId,
						},
					);
				}
			}
		});
	} finally {
		await session.close();
	}
};
