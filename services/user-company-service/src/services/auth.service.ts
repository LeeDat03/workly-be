import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { CreateUserSchema } from "../validators";
import { UserModel } from "../models";
import { config } from "../config";
import { UserProperties, UserRole } from "../models/user.model";
import { ConflictError, UnauthorizedError } from "../utils/appError";

/**
 * Hàm tạo JWT token
 * @param userId - ID của user
 * @returns {string} - JWT token
 */
const generateToken = (userId: string, role: UserRole): string => {
	const options: SignOptions = {
		expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
	};

	return jwt.sign({ id: userId, role }, config.jwt.secret, options);
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
		throw new ConflictError("Email already in use");
	}

	const hashedPassword = await bcrypt.hash(userData.password, 10);

	const newUserProperties = await UserModel.createOne({
		...userData,
		password: hashedPassword,
	} as unknown as UserProperties);

	const token = generateToken(
		newUserProperties.dataValues.userId,
		newUserProperties.dataValues.role,
	);

	const { password, ...userWithoutPassword } = newUserProperties.dataValues;

	return { user: userWithoutPassword, token };
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
