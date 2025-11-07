import {
	ModelFactory,
	ModelRelatedNodesI,
	Neogma,
	NeogmaInstance,
} from "neogma";
import { nanoid } from "nanoid";
import {
	getSchoolModel,
	SchoolInstance,
	SchoolModelType,
} from "./school.model";
import { getUserModel, UserInstance, UserModelType } from "./user.model";

export interface EducationProperties {
	educationId: string;
	degree: string;
	major: string;
	start_date: string;
	end_date?: string;
	description?: string;
	[key: string]: any;
}

interface IEducationRelatedNodes {
	User: ModelRelatedNodesI<UserModelType, UserInstance, {}, {}>;
	School: ModelRelatedNodesI<SchoolModelType, SchoolInstance, {}, {}>;
}

export type EducationInstance = NeogmaInstance<
	EducationProperties,
	IEducationRelatedNodes
>;

let EducationModel: ReturnType<
	typeof ModelFactory<EducationProperties, IEducationRelatedNodes>
>;

export const getEducationModel = (neogma: Neogma) => {
	if (EducationModel) {
		return EducationModel;
	}

	// const UserModel = getUserModel(neogma);
	const SchoolModel = getSchoolModel(neogma);

	EducationModel = ModelFactory<EducationProperties, IEducationRelatedNodes>(
		{
			label: "Education",
			schema: {
				educationId: {
					type: "string",
					required: true,
				},
				degree: {
					type: "string",
					required: true,
				},
				major: {
					type: "string",
					required: true,
				},
				start_date: {
					type: "string",
					required: true,
				},
				end_date: { type: "string" },
				description: { type: "string" },
			},
			primaryKeyField: "educationId",

			relationships: {
				User: {
					model: "User",
					direction: "in",
					name: "HAS_EDUCATION",
				},
				School: {
					model: SchoolModel,
					direction: "out",
					name: "ATTENDED_SCHOOL",
				},
			},
		},
		neogma,
	);

	EducationModel.beforeCreate = (instance) => {
		instance.educationId = nanoid(12);
	};

	neogma.queryRunner.run(`
        CREATE CONSTRAINT education_id_unique IF NOT EXISTS
        FOR (e:Education)
        REQUIRE e.educationId IS UNIQUE
    `);

	return EducationModel;
};

export type EducationModelType = typeof EducationModel;
