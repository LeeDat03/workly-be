import { ModelFactory, NeogmaInstance } from "neogma";
import { database } from "../config/database";

export interface CompanyProperties {
	companyId: string;
	name: string;
	description?: string;
	website?: string;
	industry?: string;
	size?: string;
	logoUrl?: string;
	createdAt: string; // Stored as ISO string in Neo4j
	updatedAt: string; // Stored as ISO string in Neo4j
	[key: string]: any; // Index signature for Neo4j compatibility
}

export type CompanyInstance = NeogmaInstance<CompanyProperties, {}>;

const getCompanyModel = () => {
	const neogma = database.getNeogma();

	return ModelFactory<CompanyProperties>(
		{
			label: "Company",
			schema: {
				companyId: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
				},
				description: {
					type: "string",
					required: false,
				},
				website: {
					type: "string",
					required: false,
				},
				industry: {
					type: "string",
					required: false,
				},
				size: {
					type: "string",
					required: false,
				},
				logoUrl: {
					type: "string",
					required: false,
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
			primaryKeyField: "companyId",
		},
		neogma,
	);
};

export { getCompanyModel };
