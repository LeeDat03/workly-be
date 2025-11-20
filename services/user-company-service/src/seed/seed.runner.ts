import { database } from "../config/database";
import { initModels } from "../models";
import logger from "../utils/logger";
import {
	seedUser,
	seedCompany,
	seedIndustry,
	seedSkill,
	seedSchool,
} from "./index";

const runSeeder = async () => {
	try {
		console.log("🌱 Starting database seeding...\n");

		await database.connect();
		console.log("✅ Database connected successfully\n");

		await initModels(database.getNeogma());
		console.log("✅ Models initialized successfully\n");

		await seedSkill();
		await seedSchool();
		await seedIndustry();
		await seedUser(10);
		await seedCompany(10);

		// Add more seed functions here as needed
		// await seedJob();

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
