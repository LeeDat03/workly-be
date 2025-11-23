import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { logger } from "../utils";

export interface SkillProperties {
	skillId: string;
	name: string;
	[key: string]: any;
}

export type SkillInstance = NeogmaInstance<SkillProperties, {}>;

let SkillModel: ReturnType<typeof ModelFactory<SkillProperties>>;

export const getSkillModel = (neogma: Neogma) => {
	if (SkillModel) {
		return SkillModel;
	}

	SkillModel = ModelFactory<SkillProperties>(
		{
			label: "Skill",
			schema: {
				skillId: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
			},
			primaryKeyField: "skillId",
		},
		neogma,
	);

	SkillModel.beforeCreate = (instance) => {
		instance.skillId = instance.name
			.trim()
			.toLowerCase()
			.replace(/ /g, "_");
	};

	(async () => {
		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT skill_id_unique IF NOT EXISTS
				FOR (s:Skill)
				REQUIRE s.skillId IS UNIQUE
			`);
		} catch (error) {
			logger.warn("Skill skillId constraint creation warning:", error);
		}

		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT skill_name_unique IF NOT EXISTS
				FOR (s:Skill)
				REQUIRE s.name IS UNIQUE
			`);
		} catch (error) {
			logger.warn("Skill name constraint creation warning:", error);
		}
	})();

	return SkillModel;
};

export type SkillModelType = typeof SkillModel;
