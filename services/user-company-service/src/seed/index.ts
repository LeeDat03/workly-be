import { database } from "../config/database";
import bcrypt from "bcryptjs";
import { UserModel } from "../models";
import { UserProperties } from "../models/user.model";

// SEED USER
export const seedUser = async (count: number = 10) => {
	try {
		console.log(`🌱 Starting to seed ${count} users...`);

		const rawPassword = "Test@1234";
		const hashedPassword = await bcrypt.hash(rawPassword, 10);

		const usersToCreate = [];

		for (let i = 1; i <= count; i++) {
			const userData = {
				email: `user${i}@example.com`,
				name: `Test User ${i}`,
				password: hashedPassword,
			};
			usersToCreate.push(userData);
		}

		await UserModel.createMany(
			usersToCreate as unknown as UserProperties[],
		);

		console.log(`✅ Successfully seeded ${count} users.`);
	} catch (error) {
		console.error("❌ Error during user seeding:", error);
	}
};

// SEED COMPANY

// SEED INDUSTRY

// SEED SKILL

// SEED SCHOOL

// SEED JOB
