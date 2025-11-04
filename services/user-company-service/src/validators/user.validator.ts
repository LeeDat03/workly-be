import { z } from "zod";
import { UserProperties, UserRole } from "../models/user.model";
import { IndustryProperties } from "../models/industry.model";

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
	dateOfBirth: z.iso.datetime().optional().or(z.literal("")),
	role: z.enum(Object.values(UserRole)).optional(),
});

export const updateUserProfileSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
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
	industryId: z.string().optional(),
});

export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserProfileSchema = z.infer<typeof updateUserProfileSchema>;

export const toUserBasicDTO = (user: UserProperties) => {
	return {
		userId: user.userId,
		email: user.email,
		name: user.name,
	};
};

export const toUserProfileDTO = (
	user: UserProperties,
	industry?: IndustryProperties,
	// skills?: SkillProperties[],
	// workExperiences?: WorkExperienceProperties[],
	// educations?: EducationProperties[],
) => {
	const {
		password,
		passwordResetToken,
		passwordResetExpires,
		...userProfile
	} = user;

	return {
		user: userProfile,
		industry: industry
			? {
					industryId: industry.industryId,
					name: industry.name,
				}
			: undefined,
		// skills: skills ? skills : [],
		// workExperiences: workExperiences ? workExperiences : [],
		// educations: educations ? educations : [],
	};
};
