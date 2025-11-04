import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { database } from "../config/database";

export interface IndustryProperties {
	industryId: string;
	name: string;
	description?: string;
	[key: string]: any;
}

export type IndustryInstance = NeogmaInstance<IndustryProperties, {}>;

let IndustryModel: ReturnType<typeof ModelFactory<IndustryProperties>>;

export const getIndustryModel = (neogma: Neogma) => {
	if (IndustryModel) {
		return IndustryModel;
	}

	IndustryModel = ModelFactory<IndustryProperties>(
		{
			label: "Industry",
			schema: {
				industryId: {
					type: "string",
					uniqueItems: true,
				},
				name: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
				description: { type: "string" },
			},
			primaryKeyField: "industryId",
		},
		neogma,
	);

	return IndustryModel;
};

export type IndustryModelType = typeof IndustryModel;
