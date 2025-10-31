import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { CreateUserSchema } from "../validators";
import { UserModel } from "../models";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";
import { UserProperties } from "../models/user.model";
import { generateToken } from "../utils/jwt";

export const signup = async (userData: CreateUserSchema) => {
	const existingUser = await UserModel.findOne({
		where: { email: userData.email },
	});
	if (existingUser) {
		throw new ApiError(409, "Email already exists");
	}

	const hashedPassword = await bcrypt.hash(userData.password, 10);

	const newUserProperties = await UserModel.createOne({
		...userData,
		password: hashedPassword,
	} as unknown as UserProperties);

	const { password, ...userWithoutPassword } = newUserProperties;

	return userWithoutPassword;
};

/**
 * Đăng nhập người dùng
 * @param {string} email
 * @param {string} pass - Mật khẩu
 * @returns {Promise<{user: object, token: string}>}
 */
export const signin = async (email: string, pass: string) => {
	const user = await UserModel.findOne({ where: { email } });
	if (!user) {
		throw new ApiError(401, "Invalid email or password");
	}

	const isPasswordMatch = await bcrypt.compare(pass, user.password);
	if (!isPasswordMatch) {
		throw new ApiError(401, "Invalid email or password");
	}

	const token = generateToken(user.userId);

	const { password, ...userWithoutPassword } = user;

	return { user: userWithoutPassword, token };
};
