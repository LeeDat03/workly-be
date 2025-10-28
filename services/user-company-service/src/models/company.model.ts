import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { v4 as uuidv4 } from "uuid";

import { database } from "../config/database";
import { IndustryModel, UserModel } from ".";

export interface CompanyProperties {
	companyId: string;
	name: string;
	description?: string;
	foundedYear?: number;
	website?: string;
	logoUrl?: string;
	// TODO: move location to new table
	location?: string;
	[key: string]: any;
}

export type CompanyInstance = NeogmaInstance<CompanyProperties, {}>;

let CompanyModel: ReturnType<typeof ModelFactory<CompanyProperties>>;

export const getCompanyModel = (neogma: Neogma) => {
	if (CompanyModel) {
		console.log("runnnn");
		return CompanyModel;
	}

	CompanyModel = ModelFactory<CompanyProperties>(
		{
			label: "Company",
			schema: {
				companyId: {
					type: "string",
					required: true,
					uniqueItems: true,
					default: () => uuidv4(),
				},
				name: {
					type: "string",
					required: true,
				},
				description: { type: "string" },
				foundedYear: { type: "number" },
				website: { type: "string" },
				logoUrl: { type: "string" },
				location: { type: "string" },
			},
			primaryKeyField: "companyId",
		},
		neogma,
	);
	CompanyModel.addRelationships({
		owner: {
			model: () => UserModel,
			direction: "in",
			name: "OWNS",
		},
		industry: {
			model: () => IndustryModel,
			direction: "out",
			name: "BELONGS_TO",
		},
	});

	return CompanyModel;
};
