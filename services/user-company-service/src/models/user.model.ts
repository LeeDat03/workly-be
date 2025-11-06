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
import { nanoid } from "nanoid";
import {
	EducationInstance,
	EducationModelType,
	getEducationModel,
} from "./education.model";

export enum UserRole {
	ADMIN = "ADMIN",
	USER = "USER",
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
	Industry: ModelRelatedNodesI<IndustryModelType, IndustryInstance, {}, {}>;
	Skill: ModelRelatedNodesI<SkillModelType, SkillInstance, {}, {}>;
	Education: ModelRelatedNodesI<
		EducationModelType,
		EducationInstance,
		{},
		{}
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
	const IndustryModel = getIndustryModel(neogma);
	const SkillModel = getSkillModel(neogma);
	const EducationModel = getEducationModel(neogma);

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
					model: EducationModel,
					direction: "out",
					name: "HAS_EDUCATION",
				},
			},
		},
		neogma,
	);
	UserModel.beforeCreate = (instance) => {
		instance.userId = nanoid(12);
		instance.createdAt = new Date().toISOString();
		instance.updatedAt = new Date().toISOString();
		if (!instance.role) {
			instance.role = UserRole.USER;
		}
	};

	neogma.queryRunner.run(`
        CREATE CONSTRAINT user_id_unique IF NOT EXISTS
        FOR (u:User)
        REQUIRE u.userId IS UNIQUE
    `);
	neogma.queryRunner.run(`
        CREATE CONSTRAINT user_email_unique IF NOT EXISTS
        FOR (u:User)
        REQUIRE u.email IS UNIQUE
    `);

	return UserModel;
};

export type UserModelType = typeof UserModel;
