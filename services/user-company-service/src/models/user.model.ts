import { ModelFactory, NeogmaInstance } from "neogma";
import { database } from "../config/database";

export type UserRole = "ADMIN" | "USER";

export interface UserProperties {
	userId: string;
	email: string;
	password: string;
	name: string;
	bio?: string;
	headline?: string;
	avartarUrl?: string;
	bgCoverUrl?: string;
	dateOfBirth?: string; // Stored as ISO string in Neo4j
	role: UserRole;
	createdAt: string; // Stored as ISO string in Neo4j
	updatedAt: string; // Stored as ISO string in Neo4j
	[key: string]: any; // Index signature for Neo4j compatibility
}

export type UserInstance = NeogmaInstance<UserProperties, {}>;

const getUserModel = () => {
	const neogma = database.getNeogma();

	return ModelFactory<UserProperties>(
		{
			label: "User",
			schema: {
				userId: {
					type: "string",
					required: true,
				},
				email: {
					type: "string",
					required: true,
				},
				password: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
				},
				bio: {
					type: "string",
					required: false,
				},
				headline: {
					type: "string",
					required: false,
				},
				avartarUrl: {
					type: "string",
					required: false,
				},
				bgCoverUrl: {
					type: "string",
					required: false,
				},
				dateOfBirth: {
					type: "string",
					required: false,
				},
				role: {
					type: "string",
					required: true,
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
		},
		neogma,
	);
};

export { getUserModel };
