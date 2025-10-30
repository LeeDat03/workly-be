import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { CreateUserSchema } from "../validators";
import { UserModel } from "../models";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";
import { UserProperties } from "../models/user.model";

/**
 * Hàm tạo JWT token
 * @param userId - ID của user
 * @returns {string} - JWT token
 */
const generateToken = (userId: string): string => {
	const options: SignOptions = {
		expiresIn: config.jwt
			.expiresIn as unknown as jwt.SignOptions["expiresIn"],
	};

	return jwt.sign({ id: userId }, config.jwt.secret, options);
};

/**
 * Đăng ký người dùng mới
 * @param {CreateUserSchema} userData - Dữ liệu người dùng từ validator
 * @returns {Promise<object>} - Thông tin người dùng (không bao gồm password)
 */
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
	console.log("Generated Token:", token);

	const { password, ...userWithoutPassword } = user;

	return { user: userWithoutPassword, token };
};
