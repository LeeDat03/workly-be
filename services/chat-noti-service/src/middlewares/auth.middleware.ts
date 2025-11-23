import { Response, NextFunction } from "express";
import { ApiError } from "../utils";
import jwt, { Jwt } from "jsonwebtoken";
import { IAuthRequest } from "../types";
import { UnauthorizedError } from "../utils/appError";
import { config } from "../config";

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
		// Check for identity override headers first (for dev/testing or company chat)
		const overrideUserId = req.headers["x-user-id"] as string;
		const overrideUserType = req.headers["x-user-type"] as string;

		// In development mode, allow bypassing JWT with headers
		if (config.nodeEnv === "development" && overrideUserId && overrideUserType) {
			console.log("🔧 [DEV MODE] Using identity from headers (bypassing JWT):", {
				overrideUserId,
				overrideUserType,
			});

			req.user = {
				id: overrideUserId,
				type: overrideUserType as any,
			};
			return next();
		}

		// Lấy token từ header
		let token = "";
		console.log("req?.cookies", req?.cookies);

		if (req?.cookies?.token) {
			token = req.cookies.token.trim();
		} else {
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith("Bearer ")) {
				token = authHeader?.split(" ")[1].trim();
			}
		}

		if (!token) {
			throw new UnauthorizedError(
				"You are not logged in. Please log in to get access."
			);
		}

		// Try to verify JWT token
		let decoded: jwt.JwtPayload;
		try {
			decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
			console.log("decoded", decoded);
		} catch (jwtError) {
			// If JWT verification fails but we have override headers, use them
			if (overrideUserId && overrideUserType) {
				console.log("⚠️ JWT verification failed, but using identity override from headers:", {
					jwtError: jwtError instanceof Error ? jwtError.message : String(jwtError),
					overrideUserId,
					overrideUserType,
				});

				req.user = {
					id: overrideUserId,
					type: overrideUserType as any,
				};
				return next();
			}
			throw new UnauthorizedError("Invalid token, please log in again.");
		}

		if (!decoded || !decoded.id) {
			throw new UnauthorizedError("Invalid token, please log in again.");
		}

		// Check for identity override headers (for company chat)
		if (overrideUserId && overrideUserType) {
			console.log("🔄 Using identity override from headers:", {
				jwtUserId: decoded.id,
				overrideUserId,
				overrideUserType,
			});

			req.user = {
				id: overrideUserId,
				type: overrideUserType as any,
			};
		} else {
			// Default to USER type if no role in JWT (for backward compatibility)
			const userType = (decoded as any).role || "USER";
			
			console.log("✅ Using JWT identity:", {
				userId: decoded.id,
				userType,
			});

			req.user = {
				id: decoded.id,
				type: userType,
			};
		}

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
