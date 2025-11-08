import bcrypt from "bcryptjs";
import * as crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { CreateUserSchema } from "../validators";
import { UserModel } from "../models";
import { config } from "../config";
import { UserProperties, UserRole } from "../models/user.model";
import { ConflictError, UnauthorizedError } from "../utils/appError";
import { ApiError } from "../utils/ApiError";
import { sendEmail } from "../utils/mail";
import { verifyToken } from "../utils/jwt";
import { OAuthSchema } from "../validators/oauth.validator";

const generateToken = (userId: string, role: UserRole): string => {
	const options: SignOptions = {
		expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
	};

	return jwt.sign({ id: userId, role }, config.jwt.secret, options);
};

export const signup = async (userData: CreateUserSchema) => {
	const existingUser = await UserModel.findOne({
		where: { email: userData.email },
	});
	if (existingUser) {
		throw new ConflictError("Email already in use");
	}

	const hashedPassword = await bcrypt.hash(userData.password, 10);

	const newUserProperties = await UserModel.createOne({
		...userData,
		password: hashedPassword,
	} as UserProperties);

	// const token = generateToken(
	// 	newUserProperties.dataValues.userId,
	// 	newUserProperties.dataValues.role,
	// );

	const { password, ...userWithoutPassword } = newUserProperties.dataValues;

	// return { user: userWithoutPassword, token };
	return { user: userWithoutPassword };
};

export const signin = async (email: string, pass: string) => {
	const user = await UserModel.findOne({ where: { email } });
	if (!user) {
		throw new UnauthorizedError("Invalid email");
	}

	const isPasswordMatch = await bcrypt.compare(pass, user.password);
	if (!isPasswordMatch) {
		throw new UnauthorizedError("Invalid password");
	}

	const token = generateToken(user.userId, user.role);

	const { password, ...userWithoutPassword } = user.dataValues;

	return { user: userWithoutPassword, token };
};

export const findOrCreateUserByOAuth = async (data: OAuthSchema) => {
	const { email, name, image } = data;

	let userInstance = await UserModel.findOne({
		where: { email },
	});

	if (!userInstance) {
		const dummyPassword = crypto.randomBytes(32).toString("hex");
		userInstance = await UserModel.createOne({
			email,
			name: name || "User",
			avatarUrl: image,
			role: UserRole.USER,
			password: dummyPassword,
		} as UserProperties);
	}

	const user = userInstance.dataValues;

	const token = generateToken(user.userId, user.role);

	const { password, ...userWithoutPassword } = user;

	return { user: userWithoutPassword, token };
};

export const forgotPassword = async (email: string) => {
	const user = await UserModel.findOne({ where: { email } });
	if (!user) throw new ApiError(404, "User not found");
	console.log("TẠO TOKEN BẰNG SECRET:", config.jwt.secret);
	const resetToken = jwt.sign({ id: user.userId }, config.jwt.secret, {
		expiresIn: "15m",
	});

	try {
		const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
		const resetLink = `${CORS_ORIGIN}/reset-password/${resetToken}`;

		await sendEmail(
			user.email,
			"Workly Support - Password Reset",
			`
            <h3>Hello ${user.name || ""},</h3>
            <p>Please click the link below to set a new password:</p>
            <a href="${resetLink}" target="_blank">Reset Your Password</a>
            <p>This link will expire in 15 minutes.</p>
        `,
		);
	} catch (error) {
		throw new ApiError(500, "Failed to send password reset email.");
	}

	return { message: "Reset token sent to your email." };
};

export const resetPassword = async (token: string, newPassword: string) => {
	try {
		const decoded = verifyToken(token) as JwtPayload;

		const user = await UserModel.findOne({
			where: { userId: decoded.userId || decoded.id },
		});
		if (!user) throw new ApiError(404, "User not found");

		const hashedPassword = await bcrypt.hash(newPassword, 10);
		await UserModel.update(
			{ password: hashedPassword },
			{ where: { userId: user.userId } },
		);

		return { message: "Password reset successfully" };
	} catch {
		throw new ApiError(400, "Invalid or expired token");
	}
};
