import { z } from "zod";

const passwordRegex =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const createUserSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	email: z.email("Invalid email address").min(1, "Email is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(
			passwordRegex,
			"Password must contain at least one uppercase, one lowercase, one number, and one special character",
		),
	name: z.string().min(1, "Name is required"),
	bio: z.string().optional(),
	headline: z.string().optional(),
	avartarUrl: z.url().optional().or(z.literal("")),
	bgCoverUrl: z.url().optional().or(z.literal("")),
	dateOfBirth: z.iso.datetime().optional().or(z.literal("")),
	role: z.enum(["ADMIN", "USER"]).optional(),
});

export const updateUserSchema = z.object({
	name: z.string().optional(),
	bio: z.string().optional(),
	headline: z.string().optional(),
	avartarUrl: z.url().optional().or(z.literal("")),
	bgCoverUrl: z.url().optional().or(z.literal("")),
	dateOfBirth: z.iso.datetime().optional().or(z.literal("")),
	role: z.enum(["ADMIN", "USER"]).optional(),
});

export const getUserSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export const getUserByEmailSchema = z.object({
	email: z.email("Invalid email address"),
});
