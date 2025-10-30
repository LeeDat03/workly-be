import z from "zod";

import { CompanyProperties } from "../models/company.model";
import { UserProperties } from "../models/user.model";
import { IndustryProperties } from "../models/industry.model";

export const createCompanySchema = z.object({
	industryId: z.string().min(1, "Industry must be provided"),
	name: z.string().min(1, "Company name is required"),
	description: z.string().optional(),
	foundedYear: z
		.number()
		.int()
		.min(1800, "Founed year look wrong")
		.max(new Date().getFullYear(), "Founded year can not be in the future")
		.optional(),
	website: z.url({ message: "Website must be a valid url" }).optional(),
	logoUrl: z
		.url({
			message: "LogoURL must be valid",
		})
		.optional(),
	location: z.string().optional(),
});

export const updateCompanySchema = z.object({
	name: z.string().min(1, "Company name is required").optional(),
	description: z.string().optional(),
	foundedYear: z
		.number()
		.int()
		.min(1800, "Founed year look wrong")
		.max(new Date().getFullYear(), "Founded year can not be in the future")
		.optional(),
	website: z.url({ message: "Website must be a valid url" }).optional(),
	logoUrl: z
		.url({
			message: "LogoURL must be valid",
		})
		.optional(),
	location: z.string().optional(),
});

export type UpdateCompanySchema = z.infer<typeof updateCompanySchema>;
export type CreateCompanySchema = z.infer<typeof createCompanySchema>;

export const toCompanyProfileDTO = (
	company: CompanyProperties,
	owner: UserProperties,
	industry: IndustryProperties,
) => {
	return {
		company: {
			companyId: company.companyId,
			name: company.name,
			description: company.description,
			website: company.website,
			owner: {
				userId: owner.userId,
				email: owner.email,
				name: owner.name,
			},
			industry: {
				industryId: industry.industryId,
				name: industry.name,
			},
		},
	};
};
