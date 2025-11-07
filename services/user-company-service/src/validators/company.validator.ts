import z from "zod";

import { CompanyProperties, CompanySize } from "../models/company.model";
import { UserProperties } from "../models/user.model";
import { IndustryProperties } from "../models/industry.model";

const createCompanyBodySchema = z.object({
	industryId: z.string().min(1, "Industry must be provided"),
	name: z.string().min(1, "Company name is required"),
	foundedYear: z
		.number()
		.int()
		.min(1800, "Founed year look wrong")
		.max(new Date().getFullYear(), "Founded year can not be in the future"),
	size: z.enum(Object.values(CompanySize)),
	description: z.string().optional(),
	website: z.url({ message: "Website must be a valid url" }).optional(),
	logoUrl: z
		.url({
			message: "LogoURL must be valid",
		})
		.optional(),
	bannerUrl: z
		.url({
			message: "BannerURL must be valid",
		})
		.optional(),
});

export const createCompanySchema = z.object({
	body: createCompanyBodySchema,
});

const updateCompanyBodySchema = z.object({
	name: z.string().min(1, "Company name is required"),
	description: z.string().optional(),
	foundedYear: z
		.number()
		.int()
		.min(1800, "Founed year look wrong")
		.max(new Date().getFullYear(), "Founded year can not be in the future"),
	size: z.enum(Object.values(CompanySize)),
	industryId: z.string().min(1, "Industry must be provided"),
	website: z
		.url({ message: "Website must be a valid url" })
		.or(z.literal(""))
		.optional(),
	logoUrl: z
		.url({
			message: "LogoURL must be valid",
		})
		.or(z.literal(""))
		.optional(),
	bannerUrl: z
		.url({
			message: "BannerURL must be valid",
		})
		.or(z.literal(""))
		.optional(),
});

export const updateCompanySchema = z.object({
	body: updateCompanyBodySchema,
});

export type UpdateCompanySchema = z.infer<typeof updateCompanyBodySchema>;
export type CreateCompanySchema = z.infer<typeof createCompanyBodySchema>;

export const toCompanyProfileDTO = (
	company: CompanyProperties,
	owner?: UserProperties,
	industry?: IndustryProperties,
) => {
	return {
		company: {
			...company,
			owner: owner
				? {
						userId: owner.userId,
						email: owner.email,
						name: owner.name,
					}
				: undefined,
			industry: industry
				? {
						industryId: industry.industryId,
						name: industry.name,
					}
				: undefined,
		},
	};
};
