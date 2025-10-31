import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

export interface JwtPayload {
	id: string;
	iat: number;
	exp: number;
}

/**
 * Tạo ra một chuỗi JWT mới cho một user ID.
 * @param userId - ID của người dùng cần tạo token.
 * @returns {string} - Chuỗi JWT.
 */
export const generateToken = (userId: string): string => {
	const options: SignOptions = {
		expiresIn: config.jwt
			.expiresIn as unknown as jwt.SignOptions["expiresIn"],
	};

	return jwt.sign({ id: userId }, config.jwt.secret, options);
};

/**
 * Xác thực một chuỗi JWT.
 * @param token - Chuỗi JWT cần xác thực.
 * @returns {object} - Dữ liệu đã được giải mã từ token (payload).
 * @throws {Error} - Ném ra lỗi nếu token không hợp lệ hoặc hết hạn.
 */
export const verifyToken = (token: string): JwtPayload => {
	return jwt.verify(token, config.jwt.secret) as JwtPayload;
};
