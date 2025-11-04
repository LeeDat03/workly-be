import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { CreateUserSchema } from "../validators";
import { UserModel } from "../models";
import { config } from "../config";
import { UserProperties, UserRole } from "../models/user.model";
import { ConflictError, UnauthorizedError } from "../utils/appError";
import { ApiError } from "../utils/ApiError";
import { sendEmail } from "../utils/mail";
import { verifyToken } from "../utils/jwt";

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

	const token = generateToken(
		newUserProperties.dataValues.userId,
		newUserProperties.dataValues.role,
	);

	const { password, ...userWithoutPassword } = newUserProperties.dataValues;

	return { user: userWithoutPassword, token };
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

export const forgotPassword = async (email: string) => {
	const user = await UserModel.findOne({ where: { email } });
	if (!user) throw new ApiError(404, "User not found");

	const resetToken = jwt.sign({ userId: user.userId }, config.jwt.secret, {
		expiresIn: "15m",
	});

	await sendEmail(
		user.email,
		"Workly Support - Password Reset",
		`
		<h3>Hello ${user.name || ""},</h3>
		<p>We received a request to reset your password.</p>
		<p>Please use the token below to reset your password:</p>
		<pre style="padding: 10px; background: #f2f2f2;">${resetToken}</pre>
		<p>This token will expire in <b>15 minutes</b>.</p>
		<br/>
		<p>Workly Support</p>
		`,
	);

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
