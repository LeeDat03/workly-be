import { database } from "../config/database";
import bcrypt from "bcryptjs";
import { UserModel, CompanyModel, IndustryModel } from "../models";
import { UserProperties } from "../models/user.model";
import { CompanyProperties, CompanySize } from "../models/company.model";
import { IndustryProperties } from "../models/industry.model";
import { nanoid } from "nanoid";

const INDUSTRY_DATA = [
	{ industryId: "technology", name: "Technology" },
	{ industryId: "finance", name: "Finance" },
	{ industryId: "healthcare", name: "Healthcare" },
	{ industryId: "e-commerce", name: "E-Commerce" },
	{ industryId: "education", name: "Education" },
	{ industryId: "marketing", name: "Marketing" },
	{ industryId: "real-estate", name: "Real Estate" },
	{ industryId: "automotive", name: "Automotive" },
	{ industryId: "biotech", name: "Biotechnology" },
	{ industryId: "entertainment", name: "Entertainment" },
	{ industryId: "telecommunications", name: "Telecommunications" },
	{ industryId: "consulting", name: "Consulting" },
];

const SKILL_DATA = [
	{ skillId: "javascript", name: "JavaScript" },
	{ skillId: "python", name: "Python" },
	{ skillId: "react", name: "React" },
	{ skillId: "nodejs", name: "Node.js" },
	{ skillId: "mongodb", name: "MongoDB" },
	{ skillId: "express", name: "Express" },
];

const SCHOOL_DATA = [
	{ schoolId: "harvard", name: "Harvard University" },
	{ schoolId: "stanford", name: "Stanford University" },
	{ schoolId: "mit", name: "MIT" },
	{ schoolId: "oxford", name: "Oxford University" },
	{ schoolId: "cambridge", name: "Cambridge University" },
];

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
export const seedCompany = async (count: number = 10) => {
	try {
		console.log(`🌱 Starting to seed ${count} companies...`);

		const companyTemplates = [
			{
				name: "TechVision Solutions",
				description:
					"Leading software development company specializing in AI and machine learning solutions",
				website: "https://techvision.example.com",
				location: "San Francisco, CA",
				size: CompanySize["51-200"],
			},
			{
				name: "Global Finance Corp",
				description:
					"International financial services provider with expertise in digital banking",
				website: "https://globalfinance.example.com",
				location: "New York, NY",
				size: CompanySize["1000+"],
			},
			{
				name: "Creative Studio Labs",
				description:
					"Design and creative agency focused on brand identity and digital experiences",
				website: "https://creativestudio.example.com",
				location: "Los Angeles, CA",
				size: CompanySize["11-50"],
			},
			{
				name: "HealthCare Innovations",
				description:
					"Medical technology company developing healthcare software solutions",
				website: "https://healthcareinnovations.example.com",
				location: "Boston, MA",
				size: CompanySize["201-500"],
			},
			{
				name: "EduTech Learning",
				description:
					"Educational technology platform providing online learning solutions",
				website: "https://edutech.example.com",
				location: "Austin, TX",
				size: CompanySize["51-200"],
			},
			{
				name: "Green Energy Systems",
				description:
					"Renewable energy company focused on sustainable power solutions",
				website: "https://greenenergy.example.com",
				location: "Seattle, WA",
				size: CompanySize["501-1000"],
			},
			{
				name: "DataFlow Analytics",
				description:
					"Big data and analytics company helping businesses make data-driven decisions",
				website: "https://dataflow.example.com",
				location: "Chicago, IL",
				size: CompanySize["51-200"],
			},
			{
				name: "CloudSync Technologies",
				description:
					"Cloud infrastructure and services provider for modern applications",
				website: "https://cloudsync.example.com",
				location: "San Jose, CA",
				size: CompanySize["201-500"],
			},
			{
				name: "RetailPro Systems",
				description:
					"E-commerce and retail management software solutions",
				website: "https://retailpro.example.com",
				location: "Miami, FL",
				size: CompanySize["11-50"],
			},
			{
				name: "StartupHub Ventures",
				description: "Startup incubator and venture capital firm",
				website: "https://startuphub.example.com",
				location: "Denver, CO",
				size: CompanySize["1-10"],
			},
		];

		const companiesToCreate = [];
		const currentYear = new Date().getFullYear();

		for (let i = 1; i <= count; i++) {
			const template =
				companyTemplates[(i - 1) % companyTemplates.length];
			const suffix = i > companyTemplates.length ? ` ${i}` : "";

			const companyData = {
				companyId: nanoid(12),
				name: `${template.name}${suffix}`,
				description: template.description,
				foundedYear: currentYear - Math.floor(Math.random() * 20),
				size: template.size,
				website: template.website,
				location: template.location,
				industryId:
					INDUSTRY_DATA[(i - 1) % INDUSTRY_DATA.length].industryId,
			};
			companiesToCreate.push(companyData);
		}

		console.log(companiesToCreate);
		const neogma = database.getNeogma();
		await Promise.all(
			companiesToCreate.map(async (company) => {
				await neogma.queryRunner.run(
					`
				MATCH (i:Industry {industryId: $industryId})
				CREATE (c:Company { companyId: $companyId, name: $name, description: $description, foundedYear: $foundedYear, size: $size, website: $website, location: $location })
				MERGE (c)-[:IN]->(i)
				`,
					{
						industryId: company.industryId,
						companyId: company.companyId,
						name: company.name,
						description: company.description,
						foundedYear: company.foundedYear,
						size: company.size,
						website: company.website,
						location: company.location,
					},
				);
			}),
		);

		console.log(`✅ Successfully seeded ${count} companies.`);
	} catch (error) {
		console.error("❌ Error during company seeding:", error);
	}
};

// SEED INDUSTRY
export const seedIndustry = async () => {
	try {
		console.log(`🌱 Starting to seed industries...`);
		const neogma = database.getNeogma();
		await Promise.all(
			INDUSTRY_DATA.map(async (industry) => {
				await neogma.queryRunner.run(
					`
				CREATE (i:Industry { industryId: $industryId, name: $name })
				`,
					{ industryId: industry.industryId, name: industry.name },
				);
			}),
		);
		console.log(`✅ Successfully seeded industries.`);
	} catch (error) {
		console.error("❌ Error during industry seeding:", error);
	}
};

// SEED SKILL
export const seedSkill = async () => {
	try {
		console.log(`🌱 Starting to seed skills...`);
		const neogma = database.getNeogma();
		await Promise.all(
			SKILL_DATA.map(async (skill) => {
				await neogma.queryRunner.run(
					`
				CREATE (s:Skill { skillId: $skillId, name: $name })
				`,
					{ skillId: skill.skillId, name: skill.name },
				);
			}),
		);
		console.log(`✅ Successfully seeded skills.`);
	} catch (error) {
		console.error("❌ Error during skill seeding:", error);
	}
};

// SEED SCHOOL
export const seedSchool = async () => {
	try {
		console.log(`🌱 Starting to seed schools...`);
		const neogma = database.getNeogma();
		await Promise.all(
			SCHOOL_DATA.map(async (school) => {
				await neogma.queryRunner.run(
					`
				CREATE (s:School { schoolId: $schoolId, name: $name })
				`,
					{ schoolId: school.schoolId, name: school.name },
				);
			}),
		);
		console.log(`✅ Successfully seeded schools.`);
	} catch (error) {
		console.error("❌ Error during school seeding:", error);
	}
};
// SEED JOB
