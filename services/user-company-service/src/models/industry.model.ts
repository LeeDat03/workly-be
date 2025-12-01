import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { logger } from "../utils";

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

	(async () => {
		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT industry_id_unique IF NOT EXISTS
				FOR (i:Industry)
				REQUIRE i.industryId IS UNIQUE
			`);
		} catch (error) {
			logger.warn(
				"Industry industryId constraint creation warning:",
				error,
			);
		}

		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT industry_name_unique IF NOT EXISTS
				FOR (i:Industry)
				REQUIRE i.name IS UNIQUE
			`);
		} catch (error) {
			logger.warn("Industry name constraint creation warning:", error);
		}
	})();

	return IndustryModel;
};

export type IndustryModelType = typeof IndustryModel;