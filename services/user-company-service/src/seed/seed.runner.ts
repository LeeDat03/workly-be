import { database } from "../config/database";
import { initModels } from "../models";
import logger from "../utils/logger";
import {
	seedUser,
	seedCompany,
	seedIndustry,
	seedSkill,
	seedSchool,
	seedLocation,
} from "./index";

const runSeeder = async () => {
	try {
		console.log("🌱 Starting database seeding...\n");

		await database.connect();
		console.log("✅ Database connected successfully\n");

		await initModels(database.getNeogma());
		console.log("✅ Models initialized successfully\n");

		await seedLocation();
		await seedIndustry();

		await seedSkill();
		await seedSchool();
		await seedCompany();

		await seedUser(10);

		console.log("\n✅ All seeding completed successfully!");
	} catch (error) {
		console.error("\n❌ Error during seeding:", error);
		process.exit(1);
	} finally {
		// Disconnect from database
		await database.disconnect();
		console.log("\n✅ Database disconnected");
		process.exit(0);
	}
};

// Run the seeder
runSeeder();
