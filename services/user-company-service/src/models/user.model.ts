import {
	ModelFactory,
	ModelRelatedNodesI,
	Neogma,
	NeogmaInstance,
} from "neogma";
import {
	IndustryInstance,
	getIndustryModel,
	IndustryModelType,
} from "./industry.model";
import { SkillInstance, getSkillModel, SkillModelType } from "./skill.model";
import {
	SchoolInstance,
	SchoolModelType,
	getSchoolModel,
} from "./school.model";
import { nanoid } from "nanoid";
import { logger } from "../utils";
import {
	getLocationModel,
	LocationInstance,
	LocationModelType,
} from "./location.models";

export enum UserRole {
	ADMIN = "ADMIN",
	USER = "USER",
}

export enum Degree {
	Associate = "Associate",
	Bachelor = "Bachelor",
	Master = "Master",
	Doctorate = "Doctorate",
}

export interface UserProperties {
	userId: string;
	email: string;
	password: string;
	name: string;
	phone?: string;
	bio?: string;
	headline?: string;
	avatarUrl?: string;
	bgCoverUrl?: string;
	dateOfBirth?: string;
	role: UserRole;
	createdAt: string;
	updatedAt: string;
	[key: string]: any;
}

interface IUserRelatedNodes {
	Location: ModelRelatedNodesI<LocationModelType, LocationInstance, {}, {}>;
	Industry: ModelRelatedNodesI<IndustryModelType, IndustryInstance, {}, {}>;
	Skill: ModelRelatedNodesI<SkillModelType, SkillInstance, {}, {}>;
	Education: ModelRelatedNodesI<
		SchoolModelType,
		SchoolInstance,
		{
			Degree: Degree;
			Major: string;
			StartDate: string;
			EndDate: string;
			Description: string;
		},
		{
			degree: string;
			major: string;
			startDate: string;
			endDate: string;
			description: string;
		}
	>;
	FollowingUser: ModelRelatedNodesI<
		typeof UserModel,
		UserInstance,
		{
			CreatedAt: number;
		},
		{
			createdAt: string;
		}
	>;
}

export type UserInstance = NeogmaInstance<UserProperties, IUserRelatedNodes>;

let UserModel: ReturnType<
	typeof ModelFactory<UserProperties, IUserRelatedNodes>
>;

export const getUserModel = (neogma: Neogma) => {
	if (UserModel) {
		return UserModel;
	}
	const LocationModel = getLocationModel(neogma);
	const IndustryModel = getIndustryModel(neogma);
	const SkillModel = getSkillModel(neogma);
	const SchoolModel = getSchoolModel(neogma);

	UserModel = ModelFactory<UserProperties, IUserRelatedNodes>(
		{
			label: "User",
			schema: {
				userId: {
					type: "string",
					unique: true,
				},
				email: {
					type: "string",
					required: true,
					unique: true,
				},
				password: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
				},
				phone: { type: "string" },
				bio: { type: "string" },
				headline: { type: "string" },
				avatarUrl: { type: "string" },
				bgCoverUrl: { type: "string" },
				dateOfBirth: { type: "string" },
				role: {
					type: "string",
					enum: Object.values(UserRole),
					default: UserRole.USER,
				},
				createdAt: {
					type: "string",
					required: true,
				},
				updatedAt: {
					type: "string",
					required: true,
				},
			},
			primaryKeyField: "userId",
			relationships: {
				Location: {
					model: LocationModel,
					direction: "out",
					name: "LOCATED_IN",
				},
				Industry: {
					model: IndustryModel,
					direction: "out",
					name: "IN_INDUSTRY",
				},
				Skill: {
					model: SkillModel,
					direction: "out",
					name: "HAS_SKILL",
				},
				Education: {
					model: SchoolModel,
					direction: "out",
					name: "ATTEND_SCHOOL",
					properties: {
						Degree: {
							property: "degree",
							schema: {
								type: "string",
								enum: Object.values(Degree),
							},
						},
						Major: {
							property: "major",
							schema: {
								type: "string",
								required: true,
							},
						},
						StartDate: {
							property: "startDate",
							schema: {
								type: "string",
								required: true,
							},
						},
						EndDate: {
							property: "endDate",
							schema: {
								type: "string",
							},
						},
						Description: {
							property: "description",
							schema: {
								type: "string",
							},
						},
					},
				},
			},
		},
		neogma,
	);
	// Add self-referential relationship after model is created
	UserModel.relationships.FollowingUser = {
		model: UserModel,
		direction: "out",
		name: "FOLLOWING_USER",
		properties: {
			CreatedAt: {
				property: "createdAt",
				schema: {
					type: "number",
					required: true,
				},
			},
		},
	};

	UserModel.beforeCreate = (instance) => {
		instance.userId = nanoid(12);
		instance.createdAt = new Date().toISOString();
		instance.updatedAt = new Date().toISOString();
		instance.role = UserRole.USER;
	};

	(async () => {
		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT user_id_unique IF NOT EXISTS
				FOR (u:User)
				REQUIRE u.userId IS UNIQUE
			`);
		} catch (error) {
			logger.warn("User userId constraint creation warning:", error);
		}

		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT user_email_unique IF NOT EXISTS
				FOR (u:User)
				REQUIRE u.email IS UNIQUE
			`);
		} catch (error) {
			logger.warn("User email constraint creation warning:", error);
		}
	})();

	return UserModel;
};

export type UserModelType = typeof UserModel;
