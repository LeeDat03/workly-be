import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { database } from "../config/database";
import { v4 as uuidv4 } from "uuid";

export enum UserRole {
	ADMIN = "ADMIN",
	USER = "USER",
}

export interface UserProperties {
	userId: string;
	email: string;
	password: string;
	name: string;
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

export type UserInstance = NeogmaInstance<UserProperties, {}>;

let UserModel: ReturnType<typeof ModelFactory<UserProperties>>;

export const getUserModel = (neogma: Neogma) => {
	if (UserModel) {
		console.log("runnnn");
		return UserModel;
	}

	UserModel = ModelFactory<UserProperties>(
		{
			label: "User",
			schema: {
				userId: {
					type: "string",
					uniqueItems: true,
					default: () => uuidv4(),
				},
				email: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
				password: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
				},
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
					default: () => new Date().toISOString(),
				},
				updatedAt: {
					type: "string",
					default: () => new Date().toISOString(),
				},
			},
			primaryKeyField: "userId",
		},
		neogma,
	);
	UserModel.beforeCreate = (instance) => {
		instance.createdAt = new Date().toISOString();
		instance.updatedAt = new Date().toISOString();
	};

	return UserModel;
};
