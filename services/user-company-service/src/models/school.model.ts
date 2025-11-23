import { nanoid } from "nanoid";
import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { logger } from "../utils";

export interface SchoolProperties {
	schoolId: string;
	name: string;
	[key: string]: any;
}

export type SchoolInstance = NeogmaInstance<SchoolProperties, {}>;

let SchoolModel: ReturnType<typeof ModelFactory<SchoolProperties>>;

export const getSchoolModel = (neogma: Neogma) => {
	if (SchoolModel) {
		return SchoolModel;
	}

	SchoolModel = ModelFactory<SchoolProperties>(
		{
			label: "School",
			schema: {
				schoolId: {
					type: "string",
					uniqueItems: true,
				},
				name: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
			},
			primaryKeyField: "schoolId",
		},
		neogma,
	);

	SchoolModel.beforeCreate = (instance) => {
		instance.schoolId = nanoid(12);
	};

	(async () => {
		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT school_id_unique IF NOT EXISTS
				FOR (s:School)
				REQUIRE s.schoolId IS UNIQUE
			`);
		} catch (error) {
			logger.warn("School schoolId constraint creation warning:", error);
		}

		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT school_name_unique IF NOT EXISTS
				FOR (s:School)
				REQUIRE s.name IS UNIQUE
			`);
		} catch (error) {
			logger.warn("School name constraint creation warning:", error);
		}
	})();

	return SchoolModel;
};

export type SchoolModelType = typeof SchoolModel;
