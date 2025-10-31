import { Request, Response, NextFunction } from "express";
import jwt, { Jwt } from "jsonwebtoken";
import { config } from "../config";
import { UserModel } from "../models";
import { UnauthorizedError } from "../utils/appError";
import { LoggedInUserRequest } from "../types";

export const isAuthenticated = async (
	req: LoggedInUserRequest,
	res: Response,
	next: NextFunction,
) => {
	try {
		let token: string | undefined;

		if (req.cookies.token) {
			token = req.cookies.token.trim();
		} else {
			const authHeader = req.headers.authorization;
			if (authHeader && authHeader.startsWith("Bearer ")) {
				token = authHeader.split(" ")[1].trim();
			}
		}

		if (!token) {
			throw new UnauthorizedError(
				"You are not logged in. Please log in to get access.",
			);
		}

		console.log("Token received: ", token);
		const decoded = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
		console.log("Decoded token:", decoded);

		const currentUser = await UserModel.findOne({
			where: { userId: decoded.id },
			plain: true,
		});
		if (!currentUser) {
			throw new UnauthorizedError("Token invalid. Please log in again.");
		}

		req.user = {
			userId: currentUser.userId,
			email: currentUser.email,
			name: currentUser.name,
			role: currentUser.role,
		};

		next();
	} catch (error) {
		console.error("Token verify failed:", error);
		next(error);
	}
};
