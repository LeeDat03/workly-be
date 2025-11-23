import { z } from "zod";
import { Degree, UserProperties, UserRole } from "../models/user.model";
import { IndustryProperties } from "../models/industry.model";
import { SkillProperties } from "../models/skill.model";

const passwordRegex =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const createUserSchema = z.object({
	email: z.email("Invalid email address").min(1, "Email is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(
			passwordRegex,
			"Password must contain at least one uppercase, one lowercase, one number, and one special character",
		),
	name: z.string().min(1, "Name is required"),
	phone: z.string().optional(),
	bio: z.string().optional(),
	headline: z.string().optional(),
	avatarUrl: z.url().optional().or(z.literal("")),
	bgCoverUrl: z.url().optional().or(z.literal("")),
	dateOfBirth: z.string().datetime().optional().or(z.literal("")),
	role: z.nativeEnum(UserRole).optional(),
});

export const updateUserProfileSchema = z.object({
	name: z.string().min(1, "Name is required"),
	headline: z.string().optional(),
	bio: z.string().optional(),
	avatarUrl: z
		.url({ message: "Avatar URL must be a valid URL" })
		.optional()
		.or(z.literal("")),
	bgCoverUrl: z
		.url({ message: "Background cover URL must be a valid URL" })
		.optional()
		.or(z.literal("")),
	phone: z.string().optional(),
});

export const updateUserIndustriesSchema = z.object({
	industryIds: z.array(z.string()).default([]),
});

export const updateUserSkillsSchema = z.object({
	skillIds: z.array(z.string()).default([]),
});

export const updateEducationSchema = z.array(
	z.object({
		schoolId: z.string().min(1, "schoolId là bắt buộc"),
		schoolName: z.string().optional(),
		degree: z.enum(Object.values(Degree)),
		major: z.string().min(1, "Chuyên ngành là bắt buộc"),
		startDate: z.iso.datetime("Ngày bắt đầu phải là ISO datetime"),
		endDate: z.iso
			.datetime("Ngày kết thúc phải là ISO datetime")
			.optional(),
		description: z.string().optional(),
	}),
);

export const updateWorkExperienceSchema = z.array(
	z.object({
		companyId: z.string().min(1, "Company ID is required"),
		companyName: z.string().optional(),
		title: z.string().min(1, "Title is required"),
		startDate: z.iso.datetime("Start date must be a valid ISO datetime"),
		endDate: z.iso
			.datetime("End date must be a valid ISO datetime")
			.optional(),
		description: z.string().optional(),
	}),
);

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, "Current password is required"),
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				passwordRegex,
				"Password must contain at least one uppercase, one lowercase, one number, and one special character",
			),
		confirmNewPassword: z.string(),
	})
	.refine((data) => data.newPassword === data.confirmNewPassword, {
		message: "New password and confirmation do not match",
		path: ["confirmNewPassword"],
	});

////////////////////////////////////////////////////////////
// Schemas
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserProfileSchema = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserIndustriesSchema = z.infer<
	typeof updateUserIndustriesSchema
>;
export type UpdateUserSkillsSchema = z.infer<typeof updateUserSkillsSchema>;
export type UpdateEducationSchema = z.infer<typeof updateEducationSchema>;
export type UpdateWorkExperienceSchema = z.infer<
	typeof updateWorkExperienceSchema
>;
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

////////////////////////////////////////////////////////////
// DTOs
export const toUserBasicDTO = (user: UserProperties) => {
	return {
		userId: user.userId,
		email: user.email,
		name: user.name,
		avatarUrl: user.avatarUrl,
	};
};

export const toUserFollowDTO = (user: UserProperties) => {
	return {
		userId: user.userId,
		name: user.name,
		username: user.username,
		avatarUrl: user.avatarUrl,
		headline: user.headline,
	};
};

export const toUserProfileDTO = (
	user: UserProperties,
	industries?: IndustryProperties[],
	skills?: SkillProperties[],
	educations?: any[],
) => {
	const {
		password,
		passwordResetToken,
		passwordResetExpires,
		...userProfile
	} = user;

	return {
		user: userProfile,
		relationships: {
			industries: industries
				? industries.map((industry: IndustryProperties) => ({
						industryId: industry.industryId,
						name: industry.name,
						description: industry.description,
					}))
				: [],
			skills: skills
				? skills.map((skill: SkillProperties) => ({
						skillId: skill.skillId,
						name: skill.name,
					}))
				: [],
			educations: educations ? educations : [],
		},
	};
};
