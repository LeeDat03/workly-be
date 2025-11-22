import { database } from "../config/database";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
	COMPANY_DATA,
	DEFAULT_PASSWORD,
	INDUSTRY_DATA,
	LOCATION_DATA,
	SCHOOL_DATA,
	SKILL_DATA,
} from "./seed.data";

const getRandomItems = <T>(arr: T[], min: number, max: number): T[] => {
	const count = Math.floor(Math.random() * (max - min + 1)) + min;
	const shuffled = [...arr].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
};

export const seedUser = async (count: number = 10): Promise<void> => {
	console.log(`🌱 Starting to seed ${count} users...`);

	const neogma = database.getNeogma();
	const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

	// Prepare users with IDs and random skills
	const users = Array.from({ length: count }, (_, i) => ({
		userId: nanoid(12),
		email: `user${i + 1}@example.com`,
		name: `Test User ${i + 1}`,
		skillNames: getRandomItems(SKILL_DATA, 1, 5).map((s) => s.name),
	}));

	// Generate random follow relationships (each user follows 0-5 others)
	const followPairs = users.flatMap((user) => {
		const others = users.filter((u) => u.userId !== user.userId);
		return getRandomItems(others, 0, Math.min(5, others.length)).map(
			(target) => ({
				followerId: user.userId,
				followeeId: target.userId,
			}),
		);
	});

	await neogma.queryRunner.run(
		`
	  UNWIND $users AS u
	  CREATE (user:User {
		userId: u.userId,
		email: u.email,
		name: u.name,
		password: $hashedPassword
	  })
	  WITH user, u
	  MERGE (loc:Location { name: 'Ha Noi' })
	  CREATE (user)-[:LOCATED_IN]->(loc)
	  WITH user, u
	  MERGE (ind:Industry { name: 'Technology' })
	  CREATE (user)-[:IN_INDUSTRY]->(ind)
	  WITH user, u
	  UNWIND u.skillNames AS skillName
	  MATCH (skill:Skill { name: skillName })
	  CREATE (user)-[:HAS_SKILL]->(skill)
	  `,
		{ users, hashedPassword },
	);

	if (followPairs.length > 0) {
		await neogma.queryRunner.run(
			`
		  UNWIND $followPairs AS f
		  MATCH (follower:User { userId: f.followerId })
		  MATCH (followee:User { userId: f.followeeId })
		  CREATE (follower)-[:FOLLOWING_USER { createdAt: datetime() }]->(followee)
		  `,
			{ followPairs },
		);
	}
};

export const seedCompany = async (): Promise<void> => {
	const adminEmail = (name: string): string =>
		`admin_${name.toLowerCase().split(" ")[0]}@example.com`;
	const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

	console.log("🌱 Starting to seed companies...");

	const neogma = database.getNeogma();

	// Prepare companies with generated IDs
	const companies = COMPANY_DATA.map((company) => ({
		...company,
		companyId: nanoid(12),
		ownerId: nanoid(12),
		ownerName: "Admin " + company.name,
		ownerEmail: adminEmail(company.name),
	}));

	await neogma.queryRunner.run(
		`
	  UNWIND $companies AS c
	  CREATE (company:Company {
		companyId: c.companyId,
		name: c.name,
		description: c.description,
		website: c.website,
		location: c.location,
		foundedYear: c.foundedYear,
		size: c.size
	  })
	  CREATE (owner:User {
		userId: c.ownerId,
		email: c.ownerEmail,
		name: c.ownerName,
		password: $hashedPassword
      })
	  WITH company, owner
	  CREATE (owner)-[:OWNS]->(company)
	  WITH company
	  MERGE (loc:Location { name: 'Ha Noi' })
	  CREATE (company)-[:LOCATED_IN]->(loc)
	  WITH company
	  MERGE (ind:Industry { name: 'Technology' })
	  CREATE (company)-[:IN]->(ind)
	  `,
		{ companies, hashedPassword },
	);

	console.log(
		`✅ Successfully seeded ${companies.length} companies with relationships.`,
	);
};

export const seedIndustry = async () => {
	try {
		console.log(`🌱 Starting to seed industries...`);
		const neogma = database.getNeogma();
		await neogma.queryRunner.run(
			`
		  UNWIND $industries AS industry
		  CREATE (i:Industry { industryId: industry.industryId, name: industry.name })
		  `,
			{ industries: INDUSTRY_DATA },
		);
		console.log(`✅ Successfully seeded industries.`);
	} catch (error) {
		console.error("❌ Error during industry seeding:", error);
	}
};

export const seedSkill = async () => {
	try {
		console.log(`🌱 Starting to seed skills...`);
		const neogma = database.getNeogma();
		await neogma.queryRunner.run(
			`
		  UNWIND $skills AS skill
		  CREATE (s:Skill { skillId: skill.skillId, name: skill.name })
		  `,
			{ skills: SKILL_DATA },
		);
		console.log(`✅ Successfully seeded skills.`);
	} catch (error) {
		console.error("❌ Error during skill seeding:", error);
	}
};

export const seedSchool = async () => {
	try {
		console.log(`🌱 Starting to seed schools...`);
		const neogma = database.getNeogma();
		await neogma.queryRunner.run(
			`
		  UNWIND $schools AS school
		  CREATE (s:School { schoolId: school.schoolId, name: school.name })
		  `,
			{ schools: SCHOOL_DATA },
		);
		console.log(`✅ Successfully seeded schools.`);
	} catch (error) {
		console.error("❌ Error during school seeding:", error);
	}
};

export const seedLocation = async (): Promise<void> => {
	console.log("🌱 Starting to seed locations...");

	const neogma = database.getNeogma();

	await neogma.queryRunner.run(
		`
	  UNWIND $locations AS loc
	  CREATE (l:Location { locationId: loc.locationId, name: loc.name })
	  `,
		{ locations: LOCATION_DATA },
	);

	console.log(`✅ Successfully seeded ${LOCATION_DATA.length} locations.`);
};
