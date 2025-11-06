import { z } from "zod";
import { EducationProperties } from "../models/education.model";
import { SchoolProperties } from "../models/school.model";

export const createEducationSchema = z.object({
	degree: z.string().min(1, "Bằng cấp là bắt buộc"),
	major: z.string().min(1, "Chuyên ngành là bắt buộc"),
	start_date: z.string().datetime("Ngày bắt đầu phải là ISO datetime"),
	end_date: z
		.string()
		.datetime("Ngày kết thúc phải là ISO datetime")
		.optional(),
	description: z.string().optional(),
	schoolId: z.string().min(1, "schoolId là bắt buộc để liên kết"),
});

export const updateEducationSchema = z.object({
	degree: z.string().min(1, "Bằng cấp là bắt buộc").optional(),
	major: z.string().min(1, "Chuyên ngành là bắt buộc").optional(),
	start_date: z
		.string()
		.datetime("Ngày bắt đầu phải là ISO datetime")
		.optional(),
	end_date: z
		.string()
		.datetime("Ngày kết thúc phải là ISO datetime")
		.optional(),
	description: z.string().optional(),
	schoolId: z.string().min(1, "schoolId là bắt buộc").optional(),
});

export type CreateEducationSchema = z.infer<typeof createEducationSchema>;
export type UpdateEducationSchema = z.infer<typeof updateEducationSchema>;

export const EducationDTO = (
	education: EducationProperties,
	schools?: SchoolProperties[],
) => {
	const { ...educationProfile } = education;

	return {
		education: educationProfile,
		schools: schools
			? schools.map((school: SchoolProperties) => ({
					schoolId: school.schoolId,
					name: school.name,
				}))
			: [],
	};
};
