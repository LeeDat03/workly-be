import z from "zod";

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

export type CreateCompanySchema = z.infer<typeof createCompanySchema>;
