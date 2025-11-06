import { ModelFactory, Neogma, NeogmaInstance } from "neogma";

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

	return SchoolModel;
};

export type SchoolModelType = typeof SchoolModel;
