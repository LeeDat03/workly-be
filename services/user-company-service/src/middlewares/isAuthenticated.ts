import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { ApiError } from "../utils/ApiError";
import { UserModel } from "../models";
import { UserProperties } from "../models/user.model";

declare global {
	namespace Express {
		interface Request {
			user?: UserProperties;
		}
	}
}

export const isAuthenticated = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	let token;

	const authHeader = req.headers.authorization;
	if (authHeader && authHeader.startsWith("Bearer ")) {
		token = authHeader.split(" ")[1].trim();
	} else if (req.cookies.token) {
		token = req.cookies.token.trim();
	}

	if (!token) {
		return next(
			new ApiError(
				401,
				"You are not logged in. Please log in to get access.",
			),
		);
	}

	try {
		console.log("Token received: ", token);
		const decoded = jwt.verify(token, config.jwt.secret) as {
			id: string;
			iat: number;
			exp: number;
		};
		console.log("Decoded token:", decoded);

		const currentUser = await UserModel.findOne({
			where: { userId: decoded.id },
		});
		if (!currentUser) {
			return next(
				new ApiError(
					401,
					"The user belonging to this token does no longer exist.",
				),
			);
		}

		const userProperties =
			typeof currentUser.toJSON === "function"
				? currentUser.toJSON()
				: { ...currentUser };

		delete userProperties.password;

		req.user = userProperties;

		return next();
	} catch (error) {
		console.error("Token verify failed:", error);
		return next(new ApiError(401, "Invalid token. Please log in again."));
	}
};
