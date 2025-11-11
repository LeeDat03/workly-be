import { Response, NextFunction } from "express";
import { ApiError } from "../utils";
import { IAuthRequest } from "../types";

/**
 * Middleware để xác thực người dùng
 * Trong thực tế, bạn sẽ cần verify JWT token từ header
 * Hiện tại đây là mock implementation
 */
export const authenticate = async (
	req: IAuthRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		// Lấy token từ header
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw ApiError.unauthorized("No token provided");
		}

		const token = authHeader.substring(7);

		// TODO: Implement JWT verification
		// Hiện tại mock data từ header để test
		const userId = req.headers["x-user-id"] as string;
		const userType = req.headers["x-user-type"] as string;

		if (!userId || !userType) {
			throw ApiError.unauthorized("Invalid token");
		}

		// Gắn user info vào request
		req.user = {
			id: userId,
			type: userType as any,
		};

		next();
	} catch (error) {
		next(error);
	}
};

/**
 * Middleware optional authentication
 * Không bắt buộc phải có token
 */
export const optionalAuth = async (
	req: IAuthRequest,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const userId = req.headers["x-user-id"] as string;
			const userType = req.headers["x-user-type"] as string;

			if (userId && userType) {
				req.user = {
					id: userId,
					type: userType as any,
				};
			}
		}

		next();
	} catch (error) {
		next(error);
	}
};
