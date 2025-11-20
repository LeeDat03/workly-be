import {
	ModelFactory,
	ModelRelatedNodesI,
	Neogma,
	NeogmaInstance,
} from "neogma";
import { nanoid } from "nanoid";

import { IndustryModel, UserModel } from ".";
import { UserInstance } from "./user.model";
import { IndustryInstance } from "./industry.model";

export enum CompanyRoleRequestStatus {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	REJECTED = "REJECTED",
}

export enum CompanySize {
	"1-10" = "1-10",
	"11-50" = "11-50",
	"51-200" = "51-200",
	"201-500" = "201-500",
	"501-1000" = "501-1000",
	"1000+" = "1000+",
}

export interface CompanyProperties {
	companyId: string;
	name: string;
	description?: string;
	foundedYear: number;
	size: CompanySize;
	website?: string;
	logoUrl?: string;
	bannerUrl?: string;
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
	CompanyRoleRequest: ModelRelatedNodesI<
		typeof UserModel,
		UserInstance,
		{
			Status: CompanyRoleRequestStatus;
			RequestedAt: string;
		},
		{
			status: string;
			requestedAt: string;
		}
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
				},
				name: {
					type: "string",
					required: true,
				},
				description: { type: "string" },
				foundedYear: { type: "number", required: true },
				website: { type: "string" },
				logoUrl: { type: "string" },
				bannerUrl: { type: "string" },
				location: { type: "string" },
				size: {
					type: "string",
					required: true,
					enum: Object.values(CompanySize),
				},
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
				CompanyRoleRequest: {
					model: UserModel,
					direction: "in",
					name: "REQUESTS_COMPANY_ROLE",
					properties: {
						Status: {
							property: "status",
							schema: {
								type: "string",
								required: true,
								enum: Object.values(CompanyRoleRequestStatus),
							},
						},
						RequestedAt: {
							property: "requestedAt",
							schema: {
								type: "string",
								required: true,
							},
						},
					},
				},
			},
		},
		neogma,
	);

	CompanyModel.beforeCreate = (instance) => {
		instance.companyId = nanoid(12);
	};
	neogma.queryRunner.run(`
		CREATE CONSTRAINT comapany_id_unique IF NOT EXISTS
		FOR (c:Company)
		REQUIRE c.companyId IS UNIQUE
	`);
	neogma.queryRunner.run(`
		CREATE CONSTRAINT company_name_unique IF NOT EXISTS
		FOR (c:Company)
		REQUIRE c.name IS UNIQUE
	`);

	return CompanyModel;
};

export type CompanyModelType = typeof CompanyModel;
