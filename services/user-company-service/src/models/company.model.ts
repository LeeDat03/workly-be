import {
	ModelFactory,
	ModelRelatedNodesI,
	Neogma,
	NeogmaInstance,
} from "neogma";
import { v4 as uuidv4 } from "uuid";

import { IndustryModel, UserModel } from ".";
import { UserInstance } from "./user.model";
import { IndustryInstance } from "./industry.model";

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

interface ICompanyRelatedNodes {
	Owner: ModelRelatedNodesI<typeof UserModel, UserInstance, {}, {}>;
	Industry: ModelRelatedNodesI<
		typeof IndustryModel,
		IndustryInstance,
		{},
		{}
	>;
}

export type CompanyInstance = NeogmaInstance<
	CompanyProperties,
	ICompanyRelatedNodes
>;

let CompanyModel: ReturnType<
	typeof ModelFactory<CompanyProperties, ICompanyRelatedNodes>
>;

export const getCompanyModel = (neogma: Neogma) => {
	if (CompanyModel) {
		return CompanyModel;
	}

	CompanyModel = ModelFactory<CompanyProperties, ICompanyRelatedNodes>(
		{
			label: "Company",
			schema: {
				companyId: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
				name: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
				description: { type: "string" },
				foundedYear: { type: "number" },
				website: { type: "string" },
				logoUrl: { type: "string" },
				location: { type: "string" },
			},
			primaryKeyField: "companyId",
			relationships: {
				Owner: {
					model: UserModel,
					direction: "in",
					name: "OWNS",
				},
				Industry: {
					model: IndustryModel,
					direction: "out",
					name: "IN",
				},
			},
		},
		neogma,
	);

	CompanyModel.beforeCreate = (instance) => {
		instance.companyId = uuidv4();
	};

	return CompanyModel;
};
