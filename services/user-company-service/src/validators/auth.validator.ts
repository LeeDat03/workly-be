import { z } from "zod";

const passwordRegex =
	/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const signinSchema = z.object({
	email: z.email("Invalid email address").min(1, "Email is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(
			passwordRegex,
			"Password must contain at least one uppercase, one lowercase, one number, and one special character",
		),
});

export type SigninSchema = z.infer<typeof signinSchema>;

export const forgotPasswordSchema = z.object({
	body: z.object({
		email: z
			.string()
			.email("Invalid email address")
			.min(1, "Email is required"),
	}),
	params: z.object({}).optional(),
	query: z.object({}).optional(),
});

export type ForgotPasswordSchema = z.infer<
	typeof forgotPasswordSchema.shape.body
>;

export const resetPasswordSchema = z.object({
	params: z.object({
		token: z.string().min(1, "Token is required"),
	}),
	body: z.object({
		newPassword: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(
				passwordRegex,
				"Password must contain at least one uppercase, one lowercase, one number, and one special character",
			),
	}),
});
export type ResetPasswordSchema = z.infer<
	typeof resetPasswordSchema.shape.body
>;
