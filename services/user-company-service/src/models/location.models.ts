import { ModelFactory, Neogma, NeogmaInstance } from "neogma";
import { logger } from "../utils";

export interface LocationProperties {
	locationId: string;
	name: string;
	[key: string]: any;
}

export type LocationInstance = NeogmaInstance<LocationProperties, {}>;

let LocationModel: ReturnType<typeof ModelFactory<LocationProperties>>;

export const getLocationModel = (neogma: Neogma) => {
	if (LocationModel) {
		return LocationModel;
	}

	LocationModel = ModelFactory<LocationProperties>(
		{
			label: "Location",
			schema: {
				locationId: {
					type: "string",
					required: true,
				},
				name: {
					type: "string",
					required: true,
					uniqueItems: true,
				},
			},
			primaryKeyField: "locationId",
		},
		neogma,
	);

	(async () => {
		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT location_id_unique IF NOT EXISTS
				FOR (l:Location)
				REQUIRE l.locationId IS UNIQUE
			`);
		} catch (error) {
			logger.warn(
				"Location locationId constraint creation warning:",
				error,
			);
		}

		try {
			await neogma.queryRunner.run(`
				CREATE CONSTRAINT location_name_unique IF NOT EXISTS
				FOR (l:Location)
				REQUIRE l.name IS UNIQUE
			`);
		} catch (error) {
			logger.warn("Location name constraint creation warning:", error);
		}
	})();

	return LocationModel;
};

export type LocationModelType = typeof LocationModel;
